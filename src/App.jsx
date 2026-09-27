import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Search, 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Wifi, 
  Lock, 
  Home, 
  Radio, 
  Tv, 
  CheckCircle2, 
  MessageCircle, 
  HelpCircle, 
  Clock, 
  CreditCard,
  Grid
} from 'lucide-react';
import { PRODUCTS, CATEGORIES, EXCHANGE_RATES } from './data/products';
import './App.css';

// WhatsApp Contact Number for Katueté / Canindeyú
const WHATSAPP_CONTACT_NUMBER = '595983000000'; // Formato internacional Paraguay +595

export default function App() {
  const [currency, setCurrency] = useState('PYG'); // 'PYG' | 'USD' | 'BRL'
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const searchInputRef = useRef(null);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('intelbras_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Customer checkout state
  const [customerName, setCustomerName] = useState('');
  const [customerCity, setCustomerCity] = useState('Katueté');
  const [deliveryMethod, setDeliveryMethod] = useState('Retiro en depósito (Katueté)');
  const [customerNotes, setCustomerNotes] = useState('');

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('intelbras_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Focus search helper
  const handleFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Format price helper with accurate Salto del Guairá exchange rates
  const formatPrice = (p, curr = currency) => {
    if (curr === 'PYG') {
      return `₲ ${p.price_pyg.toLocaleString('es-PY')}`;
    } else if (curr === 'USD') {
      const usd = (p.price_pyg / EXCHANGE_RATES.USD_TO_PYG).toFixed(2);
      return `US$ ${usd}`;
    } else if (curr === 'BRL') {
      const brl = (p.price_pyg / EXCHANGE_RATES.BRL_TO_PYG).toFixed(2);
      return `R$ ${brl}`;
    }
    return `₲ ${p.price_pyg.toLocaleString('es-PY')}`;
  };

  // Secondary price helper
  const getSecondaryPrices = (p) => {
    const usd = (p.price_pyg / EXCHANGE_RATES.USD_TO_PYG).toFixed(2);
    const brl = (p.price_pyg / EXCHANGE_RATES.BRL_TO_PYG).toFixed(2);
    return {
      pyg: `₲ ${p.price_pyg.toLocaleString('es-PY')}`,
      usd: `US$ ${usd}`,
      brl: `R$ ${brl}`
    };
  };

  // Category Icon helper
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Redes y Fibra Óptica':
        return <Wifi size={20} />;
      case 'Seguridad e Intercom':
        return <Lock size={20} />;
      case 'Casa Inteligente (Smart Home)':
        return <Home size={20} />;
      case 'Iluminación y Sensores':
        return <Radio size={20} />;
      case 'Audio, Video y Accesorios':
        return <Tv size={20} />;
      default:
        return <Layers size={20} />;
    }
  };

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((item) => {
      // Category filter
      if (selectedCategory !== 'Todos' && item.category !== selectedCategory) {
        return false;
      }
      // Stock filter
      if (onlyInStock && item.stock <= 0) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchBarcode = item.barcode.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBarcode && !matchCat) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') {
        return a.price_pyg - b.price_pyg;
      }
      if (sortBy === 'price_desc') {
        return b.price_pyg - a.price_pyg;
      }
      if (sortBy === 'stock_desc') {
        return b.stock - a.stock;
      }
      // Default: featured first, then highest stock
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.stock - a.stock;
    });
  }, [selectedCategory, searchQuery, onlyInStock, sortBy]);

  // Cart operations
  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock > 0 ? product.stock : 99);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock > 0 ? product.stock : 99) }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxAllowed = item.product.stock > 0 ? item.product.stock : 99;
          return { ...item, quantity: Math.min(newQuantity, maxAllowed) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotals = useMemo(() => {
    const totalPyg = cart.reduce((sum, item) => sum + item.product.price_pyg * item.quantity, 0);
    const totalUsd = (totalPyg / EXCHANGE_RATES.USD_TO_PYG).toFixed(2);
    const totalBrl = (totalPyg / EXCHANGE_RATES.BRL_TO_PYG).toFixed(2);
    return { pyg: totalPyg, usd: totalUsd, brl: totalBrl };
  }, [cart]);

  // Direct 1-Click WhatsApp Order for single item
  const orderSingleViaWhatsApp = (product) => {
    const secondary = getSecondaryPrices(product);
    const msg = `¡Hola! Me interesa este equipo Intelbras disponible en Katueté:\n\n` +
      `📦 *${product.name}*\n` +
      `🔖 SKU: ${product.sku} | Código: ${product.barcode}\n` +
      `💰 Precio: ${secondary.pyg} (US$ ${secondary.usd.replace('US$ ', '')} / R$ ${secondary.brl.replace('R$ ', '')})\n` +
      `📊 Stock disponible: ${product.stock} unidades\n\n` +
      `¿Podrían confirmarme disponibilidad para retirar o coordinar envío a Katueté / Salto del Guairá?`;
    
    const url = `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // WhatsApp Checkout for full cart
  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    let message = `🛒 *NUEVO PEDIDO - CATÁLOGO INTELBRAS KATUETÉ*\n`;
    message += `👤 *Cliente:* ${customerName || 'Cliente Particular'}\n`;
    message += `📍 *Ciudad/Destino:* ${customerCity}\n`;
    message += `🚚 *Método de entrega:* ${deliveryMethod}\n`;
    if (customerNotes) {
      message += `📝 *Observaciones:* ${customerNotes}\n`;
    }
    message += `\n━━━━━━━━━━━━━━━━━━━━\n*DETALLE DEL PEDIDO:*\n`;

    cart.forEach((item, index) => {
      const p = item.product;
      const subtotal = p.price_pyg * item.quantity;
      message += `${index + 1}. *${p.name}*\n`;
      message += `   └ Cantidad: ${item.quantity}x | Unit: ₲ ${p.price_pyg.toLocaleString('es-PY')} | Sub: ₲ ${subtotal.toLocaleString('es-PY')}\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💵 *TOTAL A PAGAR:*\n`;
    message += `🇵🇾 *₲ ${cartTotals.pyg.toLocaleString('es-PY')} Guaraníes*\n`;
    message += `🇺🇸 *US$ ${cartTotals.usd} Dólares*\n`;
    message += `🇧🇷 *R$ ${cartTotals.brl} Reais*\n\n`;
    message += `Favor confirmar recepción y datos para el pago/entrega en Katueté. ¡Muchas gracias!`;

    const url = `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="app-root">
      {/* 1. Mobile-First Top Bar */}
      <div className="top-bar">
        <div className="top-bar-container">
          <div className="top-bar-location">
            <MapPin size={13} style={{ color: '#34d399', flexShrink: 0 }} />
            <span>Depósito en <span className="highlight">Katueté</span> (a 45 km de Salto del Guairá)</span>
          </div>
          <div className="top-bar-controls">
            <div className="top-bar-rates-badge">
              1 US$=₲ {EXCHANGE_RATES.USD_TO_PYG.toLocaleString('es-PY')} • 1 R$=₲ {EXCHANGE_RATES.BRL_TO_PYG.toLocaleString('es-PY')}
            </div>
            <div className="currency-toggle">
              <button 
                className={`currency-btn ${currency === 'PYG' ? 'active' : ''}`}
                onClick={() => setCurrency('PYG')}
              >
                ₲ Gs
              </button>
              <button 
                className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
                onClick={() => setCurrency('USD')}
              >
                US$
              </button>
              <button 
                className={`currency-btn ${currency === 'BRL' ? 'active' : ''}`}
                onClick={() => setCurrency('BRL')}
              >
                R$
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Sticky Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="header-top-row">
            <a href="#" className="brand-wrapper">
              <div className="brand-badge">i</div>
              <div className="brand-text">
                <h1>INTELBRAS</h1>
                <span>Katueté • Distribución Directa</span>
              </div>
            </a>

            <div className="header-actions">
              <button className="cart-button" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart size={16} />
                <span>Pedido</span>
                {cartTotalItems > 0 && (
                  <span className="cart-counter">{cartTotalItems}</span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="header-search">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Buscar equipo, modelo o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Compact & Mobile-Optimized) */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-tag">
            <Sparkles size={13} /> Stock en Katueté
          </div>
          <h2 className="hero-title">
            Equipamiento <span className="gradient-text">Intelbras</span> con Stock Inmediato
          </h2>
          <p className="hero-subtitle">
            Redes, videoseguridad, interfonía y automatización. Retiro en depósito o envíos diarios a Salto del Guairá y todo el país.
          </p>

          <div className="hero-badges-grid">
            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <Truck size={16} />
              </div>
              <div className="feature-info">
                <h4>Envíos Diarios</h4>
                <p>Katueté, Salto del Guairá y CDE</p>
              </div>
            </div>

            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <CreditCard size={16} />
              </div>
              <div className="feature-info">
                <h4>Formas de Pago</h4>
                <p>Gs, USD, Reales, SIPAP o Pix</p>
              </div>
            </div>

            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <ShieldCheck size={16} />
              </div>
              <div className="feature-info">
                <h4>Garantía Oficial</h4>
                <p>Nuevos en caja sellada</p>
              </div>
            </div>

            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <MessageCircle size={16} />
              </div>
              <div className="feature-info">
                <h4>WhatsApp</h4>
                <p>Atención al instante</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Catalog & Explorer */}
      <main className="catalog-section">
        <div className="catalog-header-card">
          {/* Horizontal Snap Category Pill Bar */}
          <div className="category-scroll-container">
            {CATEGORIES.map((cat) => {
              const count = cat === 'Todos' 
                ? PRODUCTS.length 
                : PRODUCTS.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Controls Bar */}
          <div className="controls-row">
            <div className="controls-left">
              <div className="results-count">
                <strong>{filteredProducts.length}</strong> artículos
              </div>

              <label className="stock-toggle-label">
                <input 
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="stock-toggle-input"
                />
                Solo con stock
              </label>
            </div>

            <div className="controls-right">
              <select 
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="featured">Destacados</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
                <option value="stock_desc">Mayor stock disponible</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2-Column Mobile Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fff', borderRadius: '1rem' }}>
            <HelpCircle size={40} style={{ color: '#94a3b8', margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>No se encontraron productos</h3>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>Prueba con otro término de búsqueda.</p>
            <button 
              onClick={() => { setSelectedCategory('Todos'); setSearchQuery(''); setOnlyInStock(false); }}
              className="category-pill active"
              style={{ margin: '0 auto' }}
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((p) => {
              const inStock = p.stock > 0;
              const secondary = getSecondaryPrices(p);
              return (
                <div key={p.id} className="product-card">
                  {/* Card Visual / Real Product Image */}
                  <div className="card-header-visual" onClick={() => setSelectedProduct(p)}>
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="product-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/products/default.svg';
                      }}
                    />

                    {/* Stock badge */}
                    <span className={`card-badge badge-${p.badge_color}`}>
                      {p.badge}
                    </span>

                    {/* Real stock counter */}
                    <div className={`stock-tag ${inStock ? (p.stock < 3 ? 'low-stock' : 'in-stock') : 'out-stock'}`}>
                      <span className="stock-dot"></span>
                      <span>{inStock ? `${p.stock} un.` : 'Agotado'}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="card-body">
                    <span className="product-category-text">{p.category}</span>
                    <h3 
                      className="product-title" 
                      title={p.name}
                      onClick={() => setSelectedProduct(p)}
                      style={{ cursor: 'pointer' }}
                    >
                      {p.name}
                    </h3>
                    <div className="product-sku">SKU: {p.sku}</div>

                    {/* Tablet/Desktop Specs list */}
                    <ul className="product-specs-list">
                      {(p.specs || []).slice(0, 2).map((spec, i) => (
                        <li key={i}>{spec}</li>
                      ))}
                    </ul>

                    {/* Price Block */}
                    <div className="card-price-box">
                      <div className="price-main">
                        <span className="currency-symbol">{currency === 'PYG' ? '₲' : currency === 'USD' ? 'US$' : 'R$'}</span>
                        <span>
                          {currency === 'PYG' 
                            ? p.price_pyg.toLocaleString('es-PY') 
                            : currency === 'USD' 
                              ? (p.price_pyg / EXCHANGE_RATES.USD_TO_PYG).toFixed(2) 
                              : (p.price_pyg / EXCHANGE_RATES.BRL_TO_PYG).toFixed(2)}
                        </span>
                      </div>
                      <div className="price-equivalents">
                        {currency !== 'PYG' && <span>{secondary.pyg}</span>}
                        {currency !== 'USD' && <span>{secondary.usd}</span>}
                        {currency !== 'BRL' && <span>{secondary.brl}</span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="card-actions">
                      <button 
                        className="btn-card-cart"
                        onClick={() => addToCart(p, 1)}
                        disabled={!inStock}
                      >
                        <ShoppingCart size={14} />
                        {inStock ? 'Al Carrito' : 'Agotado'}
                      </button>

                      <button 
                        className="btn-card-whatsapp"
                        onClick={() => orderSingleViaWhatsApp(p)}
                        title="Pedir directamente por WhatsApp"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Mobile Quick Cart Sticky Floating Bar (when cart has items) */}
      {cartTotalItems > 0 && !isCartOpen && (
        <div className="mobile-quick-cart-bar" onClick={() => setIsCartOpen(true)}>
          <div className="quick-cart-info">
            <span className="quick-cart-badge">{cartTotalItems}</span>
            <span>Ver Pedido</span>
          </div>
          <div className="quick-cart-total">
            ₲ {cartTotals.pyg.toLocaleString('es-PY')}
          </div>
        </div>
      )}

      {/* 6. Mobile Bottom App Navigation */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`bottom-nav-item ${selectedCategory === 'Todos' && !searchQuery ? 'active' : ''}`}
          onClick={() => { setSelectedCategory('Todos'); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <Grid size={18} />
          <span>Catálogo</span>
        </button>

        <button className="bottom-nav-item" onClick={handleFocusSearch}>
          <Search size={18} />
          <span>Buscar</span>
        </button>

        <a 
          href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent('¡Hola! Quisiera hacer una consulta sobre los equipos Intelbras en Katueté.')}`}
          target="_blank"
          rel="noreferrer"
          className="bottom-nav-item"
          style={{ color: '#25d366' }}
        >
          <MessageCircle size={18} />
          <span>WhatsApp</span>
        </a>

        <button className="bottom-nav-item" onClick={() => setIsCartOpen(true)}>
          <ShoppingCart size={18} />
          <span>Pedido</span>
          {cartTotalItems > 0 && (
            <span className="bottom-nav-badge">{cartTotalItems}</span>
          )}
        </button>
      </nav>

      {/* 7. Product Detail Bottom Sheet / Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            <div className="modal-header-visual">
              <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>
                <X size={18} />
              </button>
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name} 
                className="modal-img" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/products/default.svg';
                }}
              />
            </div>

            <div className="modal-body">
              <span style={{ fontSize: '0.75rem', color: '#009845', fontWeight: 700, textTransform: 'uppercase' }}>
                {selectedProduct.category}
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.2rem', marginBottom: '0.875rem', color: '#0f172a' }}>
                {selectedProduct.name}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#f8fafc', padding: '0.625rem 0.75rem', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>SKU</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem' }}>{selectedProduct.sku}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>EAN BARRAS</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem' }}>{selectedProduct.barcode}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>STOCK</span>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: selectedProduct.stock > 0 ? '#10b981' : '#ef4444' }}>
                    {selectedProduct.stock > 0 ? `${selectedProduct.stock} un.` : 'Agotado'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>Características:</h4>
                <ul style={{ listStyle: 'none' }}>
                  {(selectedProduct.specs || []).map((s, idx) => (
                    <li key={idx} style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '0.25rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <CheckCircle2 size={14} color="#009845" style={{ flexShrink: 0 }} /> {s}
                    </li>
                  ))}
                  <li style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <CheckCircle2 size={14} color="#009845" style={{ flexShrink: 0 }} /> Garantía oficial Intelbras con soporte local
                  </li>
                </ul>
              </div>

              {/* Price block */}
              <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#166534', fontWeight: 700 }}>PRECIO:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#14532d', lineHeight: 1.1 }}>
                  {formatPrice(selectedProduct)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
                  ₲ {selectedProduct.price_pyg.toLocaleString('es-PY')} • US$ {(selectedProduct.price_pyg / EXCHANGE_RATES.USD_TO_PYG).toFixed(2)} • R$ {(selectedProduct.price_pyg / EXCHANGE_RATES.BRL_TO_PYG).toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  className="btn-card-cart"
                  style={{ padding: '0.75rem', fontSize: '0.875rem', minHeight: '44px' }}
                  onClick={() => { addToCart(selectedProduct, 1); setSelectedProduct(null); setIsCartOpen(true); }}
                  disabled={selectedProduct.stock <= 0}
                >
                  <ShoppingCart size={16} /> Añadir al Pedido
                </button>
                <button
                  className="btn-card-whatsapp"
                  style={{ padding: '0.75rem', fontSize: '0.875rem', minHeight: '44px' }}
                  onClick={() => orderSingleViaWhatsApp(selectedProduct)}
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Shopping Cart Bottom Sheet / Drawer */}
      {isCartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            <div className="cart-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingCart size={18} color="#009845" />
                <h3>Pedido ({cartTotalItems})</h3>
              </div>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <ShoppingCart size={40} style={{ color: '#cbd5e1', marginBottom: '0.75rem' }} />
                <h4 style={{ fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>El carrito está vacío</h4>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1.25rem' }}>Explora el catálogo y añade artículos para enviar tu pedido.</p>
                <button className="category-pill active" onClick={() => setIsCartOpen(false)}>
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map((item) => {
                    const p = item.product;
                    return (
                      <div key={p.id} className="cart-item-row">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="cart-item-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/products/default.svg';
                          }}
                        />
                        <div className="cart-item-info">
                          <h4 className="cart-item-title">{p.name}</h4>
                          <div className="cart-item-price">
                            {formatPrice(p)} c/u
                          </div>
                          <div className="quantity-controls">
                            <button className="qty-btn" onClick={() => updateQuantity(p.id, item.quantity - 1)}>
                              <Minus size={14} />
                            </button>
                            <span className="qty-number">{item.quantity}</span>
                            <button className="qty-btn" onClick={() => updateQuantity(p.id, item.quantity + 1)}>
                              <Plus size={14} />
                            </button>
                            <button className="remove-item-btn" onClick={() => removeFromCart(p.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Checkout & WhatsApp Sender */}
                <div className="cart-drawer-footer">
                  <div className="checkout-field-group">
                    <label>Tu Nombre / Razón Social:</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Juan Pérez / Electro Katueté" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="checkout-input"
                    />
                  </div>

                  <div className="checkout-field-group">
                    <label>Ciudad / Destino:</label>
                    <select 
                      value={customerCity} 
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="checkout-select"
                    >
                      <option value="Katueté">Katueté</option>
                      <option value="Salto del Guairá">Salto del Guairá</option>
                      <option value="Puente Kyjhá">Puente Kyjhá</option>
                      <option value="La Paloma">La Paloma</option>
                      <option value="Nueva Esperanza">Nueva Esperanza</option>
                      <option value="Ciudad del Este">Ciudad del Este</option>
                      <option value="Mundo Novo / Guaíra (BR)">Mundo Novo / Guaíra (BR)</option>
                      <option value="Otra localidad">Otra localidad</option>
                    </select>
                  </div>

                  <div className="checkout-field-group">
                    <label>Forma de Entrega:</label>
                    <select 
                      value={deliveryMethod} 
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="checkout-select"
                    >
                      <option value="Retiro en depósito (Katueté)">Retiro en depósito en Katueté</option>
                      <option value="Envío por transportadora (Nuestra Señora / TV16 / RyS)">Envío por transportadora (Nuestra Señora / TV16 / RyS)</option>
                      <option value="Delivery local Katueté">Delivery local Katueté</option>
                      <option value="A coordinar con Salto del Guairá">A coordinar con Salto del Guairá</option>
                    </select>
                  </div>

                  {/* Totals Summary */}
                  <div className="cart-totals-summary">
                    <div className="totals-line">
                      <span style={{ color: '#64748b' }}>Subtotal en Guaraníes:</span>
                      <strong style={{ color: '#0f172a' }}>₲ {cartTotals.pyg.toLocaleString('es-PY')}</strong>
                    </div>
                    <div className="totals-line">
                      <span style={{ color: '#64748b' }}>Subtotal en Dólares (US$):</span>
                      <strong style={{ color: '#0284c7' }}>US$ {cartTotals.usd}</strong>
                    </div>
                    <div className="totals-line">
                      <span style={{ color: '#64748b' }}>Subtotal en Reales (R$):</span>
                      <strong style={{ color: '#16a34a' }}>R$ {cartTotals.brl}</strong>
                    </div>
                  </div>

                  <button className="btn-checkout-whatsapp" onClick={handleWhatsAppCheckout}>
                    <MessageCircle size={18} />
                    Enviar Pedido por WhatsApp
                  </button>
                  <p style={{ fontSize: '0.6875rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.4rem' }}>
                    Al hacer clic, se abrirá WhatsApp con los detalles de tu pedido listos para enviar.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 9. Floating WhatsApp Button (Desktop Only) */}
      <a 
        href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent('¡Hola! Me gustaría hacer una consulta sobre los productos Intelbras disponibles en Katueté.')}`}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float-btn"
        title="Consultar por WhatsApp"
      >
        <MessageCircle size={28} />
      </a>

      {/* 10. Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-col">
            <h4>Intelbras Katueté</h4>
            <p>
              Distribución y venta directa de equipamiento de telecomunicaciones, redes, videovigilancia y automatización para el departamento de Canindeyú y zona fronteriza.
            </p>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center', color: '#34d399', fontSize: '0.8125rem' }}>
              <Clock size={15} /> Lunes a Sábado de 07:30 a 17:30 hs
            </div>
          </div>

          <div className="footer-col">
            <h4>Ubicación & Envíos</h4>
            <p>📍 Katueté, Canindeyú, Paraguay.</p>
            <p style={{ marginTop: '0.4rem' }}>
              Envíos diarios a Salto del Guairá, La Paloma, Puente Kyjhá, Corpus Christi y todo Paraguay a través de empresas transportadoras reconocidas.
            </p>
          </div>

          <div className="footer-col">
            <h4>Formas de Pago Aceptadas</h4>
            <p>
              • Efectivo en Guaraníes (₲), Dólares (US$) y Reales (R$)<br />
              • Transferencias Bancarias SIPAP (Bancos de Paraguay)<br />
              • Pix para compradores de la frontera
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Intelbras Katueté. Precios y disponibilidad sujetos a rotación de stock.</div>
          <div>Equipamiento original con garantía oficial de fábrica.</div>
        </div>
      </footer>
    </div>
  );
}
