import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import BillPreviewModal from '../components/BillPreviewModal';
import {
  Scissors,
  Package,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  Phone,
  Mail,
  Armchair,
  UserCheck,
  Search,
  CheckCircle2,
  Printer,
  Share2,
  Save,
  RotateCcw,
  Sparkles,
  Percent,
  CreditCard,
  Eye,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export const BillingPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Master Data
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [chairs, setChairs] = useState([]);
  const [attendants, setAttendants] = useState([]);
  const [settings, setSettings] = useState({});

  // Active POS Form State
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedChair, setSelectedChair] = useState('');
  const [selectedAttendant, setSelectedAttendant] = useState('');
  const [notes, setNotes] = useState('');

  // Cart Items
  const [cartItems, setCartItems] = useState([]);

  // Discount & Tax Settings
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | 'percentage'
  const [discountValue, setDiscountValue] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18); // Default 18% GST

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [splitPayment, setSplitPayment] = useState({
    cash: 0,
    upi: 0,
    debitCard: 0,
    creditCard: 0,
    other: 0,
  });

  // Catalog UI Tabs & Filters
  const [catalogTab, setCatalogTab] = useState('services'); // 'services' | 'products'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Generated Bill
  const [generatedBill, setGeneratedBill] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load master records
  const loadMasterData = async () => {
    try {
      const [srvRes, prdRes, chrRes, attRes, setRes] = await Promise.all([
        api.get('/services?limit=100&isActive=true'),
        api.get('/products?limit=100&isActive=true'),
        api.get('/chairs'),
        api.get('/attendants?status=active'),
        api.get('/settings'),
      ]);

      if (srvRes.data.success) setServices(srvRes.data.services);
      if (prdRes.data.success) setProducts(prdRes.data.products);
      if (chrRes.data.success) setChairs(chrRes.data.chairs);
      if (attRes.data.success) setAttendants(attRes.data.attendants);
      if (setRes.data.success) {
        setSettings(setRes.data.settings);
        if (setRes.data.settings.defaultGstPercent !== undefined) {
          setTaxPercent(setRes.data.settings.defaultGstPercent);
        }
      }
    } catch (err) {
      console.error('Failed to fetch POS master data:', err);
      toast.error('Failed to load catalog');
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Quick Customer Lookup by Mobile
  const handleMobileLookup = async (mobileVal) => {
    setCustomerMobile(mobileVal);
    if (mobileVal.trim().length >= 10) {
      try {
        const res = await api.get(`/customers/search/${mobileVal.trim()}`);
        if (res.data.success && res.data.customer) {
          setCustomerName(res.data.customer.name);
          if (res.data.customer.email) setCustomerEmail(res.data.customer.email);
          toast.success(`Existing client found: ${res.data.customer.name}`, { id: 'cust-found' });
        }
      } catch (err) {
        // Customer not found yet, will create new
      }
    }
  };

  // Add Item to POS Cart
  const addItemToCart = (item, type = 'service') => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.itemId === item._id && i.itemType === type);

      if (existingIdx > -1) {
        const updated = [...prev];
        const current = updated[existingIdx];

        // Stock check for products
        if (type === 'product' && current.quantity + 1 > item.currentStock) {
          toast.error(`Only ${item.currentStock} units available in stock`);
          return prev;
        }

        const newQty = current.quantity + 1;
        const total = newQty * current.unitPrice - current.discountAmount;
        updated[existingIdx] = { ...current, quantity: newQty, totalAmount: Math.max(0, total) };
        return updated;
      }

      // Check product initial stock
      if (type === 'product' && item.currentStock <= 0) {
        toast.error('Item is out of stock!');
        return prev;
      }

      const unitPrice = type === 'service' ? item.price : item.sellingPrice;
      const newItem = {
        itemId: item._id,
        itemType: type,
        name: item.name,
        category: item.category,
        quantity: 1,
        unitPrice,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: item.taxPercentage || 18,
        totalAmount: unitPrice,
      };
      return [...prev, newItem];
    });
  };

  // Update Cart Item Quantity
  const updateQuantity = (index, delta) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        return updated.filter((_, idx) => idx !== index);
      }

      // Product stock boundary
      if (item.itemType === 'product') {
        const prod = products.find((p) => p._id === item.itemId);
        if (prod && newQty > prod.currentStock) {
          toast.error(`Only ${prod.currentStock} units in stock`);
          return prev;
        }
      }

      const total = newQty * item.unitPrice - (item.discountAmount || 0);
      updated[index] = { ...item, quantity: newQty, totalAmount: Math.max(0, total) };
      return updated;
    });
  };

  // Remove Cart Item
  const removeItem = (index) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Compute Bill Financials
  const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  let discountTotal = 0;
  if (discountType === 'percentage') {
    discountTotal = (subtotal * (Number(discountValue) || 0)) / 100;
  } else {
    discountTotal = Number(discountValue) || 0;
  }
  discountTotal = Math.min(discountTotal, subtotal);

  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const totalTax = (taxableAmount * (Number(taxPercent) || 0)) / 100;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const grandTotal = Math.round(taxableAmount + totalTax);

  const effectiveAmountReceived = amountReceived === '' ? grandTotal : Number(amountReceived);
  const balanceDue = Math.max(0, grandTotal - effectiveAmountReceived);
  const paymentStatus = balanceDue === 0 ? 'Paid' : effectiveAmountReceived > 0 ? 'Partial' : 'Unpaid';

  // Clear / Reset Terminal
  const handleReset = () => {
    setCustomerName('');
    setCustomerMobile('');
    setCustomerEmail('');
    setSelectedChair('');
    setSelectedAttendant('');
    setNotes('');
    setCartItems([]);
    setDiscountValue(0);
    setAmountReceived('');
    setPaymentMethod('Cash');
    setSplitPayment({ cash: 0, upi: 0, debitCard: 0, creditCard: 0, other: 0 });
  };

  // Handle Bill Generation & Save
  const handleGenerateBill = async (status = 'Completed') => {
    if (!customerName.trim() || !customerMobile.trim()) {
      toast.error('Please enter Customer Name and Mobile number');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Please add at least one Service or Product to the invoice');
      return;
    }

    if (!selectedChair) {
      toast.error('Please select a Chair / Styling Station');
      return;
    }

    if (!selectedAttendant) {
      toast.error('Please select an Attendant / Stylist');
      return;
    }

    try {
      setIsSubmitting(true);

      const chairObj = chairs.find((c) => c._id === selectedChair);
      const attendantObj = attendants.find((a) => a._id === selectedAttendant);

      const payload = {
        customer: {
          name: customerName.trim(),
          mobile: customerMobile.trim(),
          email: customerEmail.trim(),
        },
        chair: {
          chairId: chairObj?._id,
          chairNumber: chairObj?.chairNumber,
          name: chairObj?.name,
        },
        attendant: {
          attendantId: attendantObj?._id,
          name: attendantObj?.fullName,
        },
        items: cartItems,
        subtotal,
        discountType,
        discountValue: Number(discountValue) || 0,
        discountTotal,
        taxPercent: Number(taxPercent) || 0,
        cgst,
        sgst,
        taxTotal: totalTax,
        grandTotal,
        amountReceived: effectiveAmountReceived,
        balanceAmount: balanceDue,
        paymentStatus,
        paymentMethod,
        splitPaymentDetails: paymentMethod === 'Split payment' ? splitPayment : undefined,
        notes: notes.trim(),
        status,
      };

      const res = await api.post('/bills', payload);

      if (res.data.success) {
        setGeneratedBill(res.data.bill);
        setPreviewOpen(true);

        if (status === 'Completed') {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          toast.success(`Bill #${res.data.bill.billNumber} created successfully!`);
        } else {
          toast.success('Bill saved as draft');
        }

        handleReset();
        loadMasterData(); // Refresh product stock & chairs
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Catalog Items
  const filteredServices = services.filter((srv) => {
    const matchCat = selectedCategory === 'All' || srv.category === selectedCategory;
    const matchGender = selectedGender === 'All' || srv.genderCategory === selectedGender;
    const matchSearch =
      !searchQuery ||
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchGender && matchSearch;
  });

  const filteredProducts = products.filter((prd) => {
    const matchCat = selectedCategory === 'All' || prd.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      prd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prd.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prd.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Extract Categories
  const serviceCategories = ['All', ...new Set(services.map((s) => s.category))];
  const productCategories = ['All', ...new Set(products.map((p) => p.category))];

  return (
    <div className="space-y-5 pb-12">
      {/* POS Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Services & Products Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-4 sm:p-5 shadow-sm space-y-4">
            {/* Catalog Switcher & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Services vs Products Tab Switch */}
              <div className="bg-gray-100 dark:bg-charcoal-800 p-1 rounded-xl flex">
                <button
                  type="button"
                  onClick={() => {
                    setCatalogTab('services');
                    setSelectedCategory('All');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    catalogTab === 'services'
                      ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                  <span>Services Menu ({services.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCatalogTab('products');
                    setSelectedCategory('All');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    catalogTab === 'products'
                      ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Retail Products ({products.length})</span>
                </button>
              </div>

              {/* Instant Search Bar */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${catalogTab}...`}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Gender Filters for Services */}
            {catalogTab === 'services' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-gray-400 font-semibold shrink-0">Target:</span>
                {['All', 'Men', 'Women', 'Unisex', 'Kids'].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 ${
                      selectedGender === gender
                        ? 'bg-gold-500/20 text-gold-600 dark:text-gold-400 border border-gold-500/40 font-bold'
                        : 'bg-gray-50 dark:bg-charcoal-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            )}

            {/* Category Chips Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              {(catalogTab === 'services' ? serviceCategories : productCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-charcoal-900 text-white dark:bg-white dark:text-black font-bold shadow-sm'
                      : 'bg-gray-100 dark:bg-charcoal-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items Grid View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {catalogTab === 'services' ? (
                filteredServices.length > 0 ? (
                  filteredServices.map((srv) => (
                    <div
                      key={srv._id}
                      onClick={() => addItemToCart(srv, 'service')}
                      className="p-3.5 rounded-xl bg-gray-50 dark:bg-charcoal-950/70 border border-gray-200 dark:border-charcoal-800 hover:border-gold-500/60 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-200 dark:bg-charcoal-800 text-gray-600 dark:text-gray-400">
                            {srv.genderCategory} • {srv.category}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">{srv.duration}m</span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 line-clamp-2">
                          {srv.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-charcoal-800">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          ₹ {srv.price}
                        </span>
                        <button className="w-6 h-6 rounded-md bg-black text-white dark:bg-gold-500 dark:text-black flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-xs text-gray-400">
                    No services found matching filters.
                  </div>
                )
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((prd) => (
                  <div
                    key={prd._id}
                    onClick={() => addItemToCart(prd, 'product')}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-charcoal-950/70 border border-gray-200 dark:border-charcoal-800 hover:border-gold-500/60 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-200 dark:bg-charcoal-800 text-gray-600 dark:text-gray-400">
                          {prd.brand}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            prd.currentStock <= prd.minStockWarning ? 'text-red-500' : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {prd.currentStock} in stock
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 line-clamp-2">
                        {prd.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{prd.sku}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-charcoal-800">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        ₹ {prd.sellingPrice}
                      </span>
                      <button className="w-6 h-6 rounded-md bg-black text-white dark:bg-gold-500 dark:text-black flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-xs text-gray-400">
                  No retail products found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details, Live Cart & Billing Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Customer & Station Card */}
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-4 sm:p-5 shadow-sm space-y-3.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-gold-500" />
              1. Customer & Station Setup
            </h3>

            {/* Mobile & Auto-lookup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(e) => handleMobileLookup(e.target.value)}
                    placeholder="10-digit mobile"
                    maxLength={10}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-gold-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., Karthik Raja"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Chair & Attendant Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Chair / Station <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedChair}
                  onChange={(e) => setSelectedChair(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Chair --</option>
                  {chairs.map((chair) => (
                    <option key={chair._id} value={chair._id}>
                      {chair.chairNumber} - {chair.name} ({chair.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Attendant / Stylist <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAttendant}
                  onChange={(e) => setSelectedAttendant(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Attendant --</option>
                  {attendants.map((att) => (
                    <option key={att._id} value={att._id}>
                      {att.fullName} ({att.attendantId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cart & Financial Calculations Card */}
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-charcoal-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-gold-500" />
                2. Invoice Items ({cartItems.length})
              </h3>
              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  className="text-[11px] text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Cart is empty. Click services or products on the left to add items.
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-950/60 border border-gray-100 dark:border-charcoal-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate flex-1">
                      <h5 className="font-bold text-gray-900 dark:text-white truncate">{item.name}</h5>
                      <span className="text-[10px] text-gray-400">
                        ₹{item.unitPrice} × {item.quantity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-5 h-5 rounded bg-gray-200 dark:bg-charcoal-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-5 h-5 rounded bg-gray-200 dark:bg-charcoal-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="w-16 text-right font-bold text-gray-900 dark:text-white">
                      ₹{item.totalAmount}
                    </span>

                    <button
                      onClick={() => removeItem(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Discount & Tax Controls */}
            <div className="pt-2 border-t border-gray-100 dark:border-charcoal-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Discount
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="fixed">Flat ₹</option>
                    <option value="percentage">%</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  GST Tax %
                </label>
                <input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Cash', 'UPI', 'Debit card', 'Credit card', 'Split payment', 'Other'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                      paymentMethod === method
                        ? 'bg-black text-white dark:bg-gold-500 dark:text-black border-black dark:border-gold-500 shadow-sm'
                        : 'bg-gray-50 dark:bg-charcoal-800 border-gray-200 dark:border-charcoal-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Payment Breakdown Inputs */}
            {paymentMethod === 'Split payment' && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-charcoal-950 border border-gray-200 dark:border-charcoal-800 space-y-2 text-xs">
                <span className="font-bold text-gray-800 dark:text-gray-200 block">
                  Split Payment Breakdown
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-500">Cash Amount (₹)</span>
                    <input
                      type="number"
                      value={splitPayment.cash}
                      onChange={(e) => setSplitPayment({ ...splitPayment, cash: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded border dark:border-charcoal-700 bg-white dark:bg-charcoal-900"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500">UPI Amount (₹)</span>
                    <input
                      type="number"
                      value={splitPayment.upi}
                      onChange={(e) => setSplitPayment({ ...splitPayment, upi: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded border dark:border-charcoal-700 bg-white dark:bg-charcoal-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Financial Ledger Calculation Summary */}
            <div className="p-3.5 rounded-xl bg-gray-100 dark:bg-charcoal-950 border border-gray-200 dark:border-charcoal-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal:</span>
                <span>₹ {subtotal.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Discount:</span>
                  <span>- ₹ {discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax (CGST 9% + SGST 9%):</span>
                <span>₹ {totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-charcoal-800">
                <span>GRAND TOTAL:</span>
                <span className="text-gold-600 dark:text-gold-400 font-mono text-base">₹ {grandTotal}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleGenerateBill('Completed')}
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-extrabold text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Generate & Print Bill</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateBill('Draft')}
                  disabled={isSubmitting || cartItems.length === 0}
                  className="py-2 px-3 rounded-lg border border-gray-300 dark:border-charcoal-700 hover:bg-gray-100 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2 px-3 rounded-lg border border-gray-300 dark:border-charcoal-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Form</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Preview & Print Modal */}
      {previewOpen && generatedBill && (
        <BillPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          bill={generatedBill}
          settings={settings}
        />
      )}
    </div>
  );
};

export default BillingPage;
