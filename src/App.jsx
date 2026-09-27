import React, { useState, useMemo, useEffect } from 'react';
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
  PhoneCall, 
  Tag, 
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
  ArrowRight
} from 'lucide-react';
import { PRODUCTS, CATEGORIES } from './data/products';
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

  // Format price helper
  const formatPrice = (p, curr = currency) => {
    if (curr === 'PYG') {
      return `₲ ${p.price_pyg.toLocaleString('es-PY')}`;
    } else if (curr === 'USD') {
      return `US$ ${p.price_usd}`;
    } else if (curr === 'BRL') {
      return `R$ ${p.price_brl}`;
    }
    return `₲ ${p.price_pyg}`;
  };

  // Category Icon helper
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Redes y Fibra Óptica':
        return <Wifi size={24} />;
      case 'Seguridad e Intercom':
        return <Lock size={24} />;
      case 'Casa Inteligente (Smart Home)':
        return <Home size={24} />;
      case 'Iluminación y Sensores':
        return <Radio size={24} />;
      case 'Audio, Video y Accesorios':
        return <Tv size={24} />;
      default:
        return <Layers size={24} />;
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
    const totalUsd = cart.reduce((sum, item) => sum + item.product.price_usd * item.quantity, 0);
    const totalBrl = cart.reduce((sum, item) => sum + item.product.price_brl * item.quantity, 0);
    return { pyg: totalPyg, usd: totalUsd, brl: totalBrl };
  }, [cart]);

  // Direct 1-Click WhatsApp Order for single item
  const orderSingleViaWhatsApp = (product) => {
    const msg = `¡Hola! Me interesa este equipo Intelbras disponible en Katueté:\n\n` +
      `📦 *${product.name}*\n` +
      `🔖 SKU: ${product.sku} | Código: ${product.barcode}\n` +
      `💰 Precio: ₲ ${product.price_pyg.toLocaleString('es-PY')} (US$ ${product.price_usd} / R$ ${product.price_brl})\n` +
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
      {/* 1. Top Bar */}
      <div className="top-bar">
        <div className="top-bar-container">
          <div className="top-bar-location">
            <MapPin size={15} className="text-emerald-400" />
            <span>Depósito Físico en <span className="highlight">Katueté, Canindeyú</span> (a 45 km de Salto del Guairá)</span>
          </div>
          <div className="top-bar-controls">
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Moneda:</span>
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
                US$ Dólar
              </button>
              <button 
                className={`currency-btn ${currency === 'BRL' ? 'active' : ''}`}
                onClick={() => setCurrency('BRL')}
              >
                R$ Real
              </button>
            </div>
            <a 
              href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#34d399', fontWeight: 600 }}
            >
              <MessageCircle size={14} /> WhatsApp Directo
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Sticky Header */}
      <header className="main-header">
        <div className="header-container">
          <a href="#" className="brand-wrapper">
            <div className="brand-badge">i</div>
            <div className="brand-text">
              <h1>INTELBRAS</h1>
              <span>Katueté • Liquidación & Stock Inmediato</span>
            </div>
          </a>

          {/* Search bar */}
          <div className="header-search">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text"
                placeholder="Buscar por equipo, modelo, SKU o código de barras..."
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

          {/* Cart Trigger */}
          <div className="header-actions">
            <button className="cart-button" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={18} />
              <span>Pedido</span>
              {cartTotalItems > 0 && (
                <span className="cart-counter">{cartTotalItems}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-tag">
            <Sparkles size={14} /> Stock Físico Listo Para Retiro o Envío
          </div>
          <h2 className="hero-title">
            Equipamiento <span className="gradient-text">Intelbras</span> con Margen de Liquidación Rápida
          </h2>
          <p className="hero-subtitle">
            Precios directos de costo + markup accesible redondeados en múltiplos de 5 para salida express.
            Redes, Fibra Óptica, Cámaras, Videoporteros, Smart Home e Interfonía en Katueté y zona Salto del Guairá.
          </p>

          <div className="hero-badges-grid">
            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <Truck size={22} />
              </div>
              <div className="feature-info">
                <h4>Entrega Local & Frontera</h4>
                <p>Katueté, Salto del Guairá, Puente Kyjhá, La Paloma y CDE.</p>
              </div>
            </div>

            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <Tag size={22} />
              </div>
              <div className="feature-info">
                <h4>Precios Redondos</h4>
                <p>Valores en múltiplos de 5 exactos en ₲ Guaraníes, US$ y R$.</p>
              </div>
            </div>

            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <ShieldCheck size={22} />
              </div>
              <div className="feature-info">
                <h4>Garantía Intelbras</h4>
                <p>Equipos originales, nuevos en caja sellada con soporte.</p>
              </div>
            </div>

            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <MessageCircle size={22} />
              </div>
              <div className="feature-info">
                <h4>Atención en WhatsApp</h4>
                <p>Cotizaciones y confirmación de pedidos al instante.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Catalog & Explorer */}
      <main className="catalog-section">
        <div className="catalog-header-card">
          {/* Category Tabs */}
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
                Mostrando <strong>{filteredProducts.length}</strong> de <strong>{PRODUCTS.length}</strong> artículos
              </div>

              <label className="stock-toggle-label">
                <input 
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="stock-toggle-input"
                />
                Solo con stock disponible
              </label>
            </div>

            <div className="controls-right">
              <label htmlFor="sort-select" style={{ fontSize: '0.8125rem', color: '#64748b' }}>Ordenar:</label>
              <select 
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="featured">Destacados / Liquidación</option>
                <option value="price_asc">Menor precio primero</option>
                <option value="price_desc">Mayor precio primero</option>
                <option value="stock_desc">Mayor stock en depósito</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: '1rem' }}>
            <HelpCircle size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No se encontraron productos</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Intenta ajustar los filtros de búsqueda o categoría.</p>
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
              return (
                <div key={p.id} className="product-card">
                  {/* Card Visual / Thumbnail */}
                  <div className="card-header-visual">
                    <div className="visual-icon-box">
                      {getCategoryIcon(p.category)}
                    </div>

                    {/* Stock badge */}
                    <span className={`card-badge badge-${p.badge_color}`}>
                      {p.badge}
                    </span>

                    {/* Real stock counter */}
                    <div className={`stock-tag ${inStock ? (p.stock < 3 ? 'low-stock' : 'in-stock') : 'out-stock'}`}>
                      <span className="stock-dot"></span>
                      <span>{inStock ? `${p.stock} en depósito` : 'Agotado'}</span>
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
                    <div className="product-sku">SKU: {p.sku} • EAN: {p.barcode}</div>

                    {/* Bullet Specs */}
                    <ul className="product-specs-list">
                      {p.specs.slice(0, 2).map((spec, i) => (
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
                              ? p.price_usd 
                              : p.price_brl}
                        </span>
                      </div>
                      <div className="price-equivalents">
                        {currency !== 'PYG' && <span>₲ {p.price_pyg.toLocaleString('es-PY')}</span>}
                        {currency !== 'USD' && <span>US$ {p.price_usd}</span>}
                        {currency !== 'BRL' && <span>R$ {p.price_brl}</span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="card-actions">
                      <button 
                        className="btn-card-cart"
                        onClick={() => addToCart(p, 1)}
                        disabled={!inStock}
                      >
                        <ShoppingCart size={15} />
                        {inStock ? 'Al Carrito' : 'Agotado'}
                      </button>

                      <button 
                        className="btn-card-whatsapp"
                        onClick={() => orderSingleViaWhatsApp(p)}
                        title="Pedir directamente por WhatsApp"
                      >
                        <MessageCircle size={15} />
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

      {/* 5. Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-visual">
              <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>
                <X size={18} />
              </button>
              <div style={{ textAlign: 'center', zIndex: 1 }}>
                <div style={{ margin: '0 auto 0.5rem', width: '56px', height: '56px', background: 'rgba(255,255,255,0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getCategoryIcon(selectedProduct.category)}
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                  {selectedProduct.category}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>{selectedProduct.name}</h3>
              </div>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CÓDIGO DE ARTÍCULO</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{selectedProduct.sku}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CÓDIGO DE BARRAS</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{selectedProduct.barcode}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>DISPONIBILIDAD</span>
                  <div style={{ fontWeight: 700, color: selectedProduct.stock > 0 ? '#10b981' : '#ef4444' }}>
                    {selectedProduct.stock > 0 ? `${selectedProduct.stock} unidades` : 'Sin stock'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#334155' }}>Características Principales:</h4>
                <ul style={{ listStyle: 'none' }}>
                  {selectedProduct.specs.map((s, idx) => (
                    <li key={idx} style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.35rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <CheckCircle2 size={15} color="#009845" /> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>PRECIO DE LIQUIDACIÓN:</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#14532d' }}>
                    {formatPrice(selectedProduct)}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#16a34a' }}>
                    Equivalencias: ₲ {selectedProduct.price_pyg.toLocaleString('es-PY')} | US$ {selectedProduct.price_usd} | R$ {selectedProduct.price_brl}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  className="btn-card-cart"
                  style={{ padding: '0.875rem', fontSize: '0.9375rem' }}
                  onClick={() => { addToCart(selectedProduct, 1); setSelectedProduct(null); setIsCartOpen(true); }}
                  disabled={selectedProduct.stock <= 0}
                >
                  <ShoppingCart size={18} /> Añadir al Pedido
                </button>
                <button
                  className="btn-card-whatsapp"
                  style={{ padding: '0.875rem', fontSize: '0.9375rem' }}
                  onClick={() => orderSingleViaWhatsApp(selectedProduct)}
                >
                  <MessageCircle size={18} /> Pedir por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Shopping Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} color="#009845" />
                <h3>Pedido de Compra ({cartTotalItems})</h3>
              </div>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <ShoppingCart size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                <h4 style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>El carrito está vacío</h4>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Explora el catálogo y añade artículos para enviar tu pedido.</p>
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
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Subtotal en Guaraníes:</span>
                      <strong style={{ color: '#0f172a' }}>₲ {cartTotals.pyg.toLocaleString('es-PY')}</strong>
                    </div>
                    <div className="totals-line">
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Subtotal en Dólares:</span>
                      <strong style={{ color: '#0284c7' }}>US$ {cartTotals.usd}</strong>
                    </div>
                    <div className="totals-line">
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Subtotal en Reales:</span>
                      <strong style={{ color: '#16a34a' }}>R$ {cartTotals.brl}</strong>
                    </div>
                  </div>

                  <button className="btn-checkout-whatsapp" onClick={handleWhatsAppCheckout}>
                    <MessageCircle size={20} />
                    Enviar Pedido por WhatsApp
                  </button>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.5rem' }}>
                    Al hacer clic, se abrirá WhatsApp con los detalles de tu pedido listo para enviar.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 7. Floating WhatsApp Button */}
      <a 
        href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent('¡Hola! Me gustaría hacer una consulta sobre los productos Intelbras disponibles en Katueté.')}`}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float-btn"
        title="Consultar por WhatsApp"
      >
        <MessageCircle size={28} />
      </a>

      {/* 8. Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-col">
            <h4>Intelbras Katueté</h4>
            <p>
              Venta y distribución rápida de stock de telecomunicaciones, redes, videovigilancia y automatización para el departamento de Canindeyú y zona fronteriza.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#34d399', fontSize: '0.875rem' }}>
              <Clock size={16} /> Atención de Lunes a Sábado de 07:30 a 17:30 hs
            </div>
          </div>

          <div className="footer-col">
            <h4>Ubicación & Envíos</h4>
            <p>📍 Katueté, Departamento de Canindeyú, Paraguay.</p>
            <p style={{ marginTop: '0.5rem' }}>
              Envíos diarios a Salto del Guairá, La Paloma, Puente Kyjhá, Corpus Christi, Catueté y todo Paraguay a través de empresas transportadoras reconocidas.
            </p>
          </div>

          <div className="footer-col">
            <h4>Formas de Pago Aceptadas</h4>
            <p>
              • Efectivo en Guaraníes (₲), Dólares (US$) y Reales (R$)<br />
              • Transferencias Bancarias SIPAP (Bancos de Paraguay)<br />
              • Pix brasileño para compradores de frontera
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Intelbras Katueté. Precios y disponibilidad sujetos a rotación de stock.</div>
          <div>Precios redondos en múltiplos de 5 para liquidación ágil.</div>
        </div>
      </footer>
    </div>
  );
}
