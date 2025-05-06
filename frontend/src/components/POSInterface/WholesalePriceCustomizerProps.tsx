import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CartItem {
  id: number;
  name: string;
  retailPrice: number;
  wholeSalePrice?: number;
  quantity: number;
  unitType: "pcs" | "kg";
  price: number;
  customPrice?: number;
}

interface WholesalePriceCustomizerProps {
  cart: CartItem[];
  updateCartItem: (itemId: number, updates: Partial<CartItem>) => void;
  totalOriginalPrice: number;
  setFinalPrice: (price: number) => void;
  finalPrice: number;
}

const WholesalePriceCustomizer: React.FC<WholesalePriceCustomizerProps> = ({
  cart,
  updateCartItem,
  totalOriginalPrice,
  setFinalPrice,
  finalPrice
}) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [showItemPrices, setShowItemPrices] = useState<boolean>(false);

  useEffect(() => {
    // Calculate final price based on discount
    let newFinalPrice = totalOriginalPrice;
    
    if (discountType === 'percentage' && discountValue > 0) {
      newFinalPrice = totalOriginalPrice * (1 - discountValue / 100);
    } else if (discountType === 'fixed' && discountValue > 0) {
      newFinalPrice = Math.max(0, totalOriginalPrice - discountValue);
    }
    
    setFinalPrice(Number(newFinalPrice.toFixed(2)));
  }, [discountType, discountValue, totalOriginalPrice, setFinalPrice]);

  const handleItemPriceUpdate = (itemId: number, newPrice: number) => {
    updateCartItem(itemId, { customPrice: newPrice });
  };

  const toggleItemExpand = (itemId: number) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  // Calculate total discount
  const totalDiscount = totalOriginalPrice - finalPrice;
  const discountPercentage = (totalDiscount / totalOriginalPrice) * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        Wholesale Price Customization
      </h3>

      {/* Discount Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
          <div className="flex">
            <button
              type="button"
              onClick={() => setDiscountType('percentage')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                discountType === 'percentage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => setDiscountType('fixed')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                discountType === 'fixed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fixed Amount (₹)
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
            {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="number"
              id="discountValue"
              value={discountValue}
              onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="0"
              min="0"
              max={discountType === 'percentage' ? 100 : undefined}
              step={discountType === 'percentage' ? 1 : 10}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{discountType === 'percentage' ? '%' : '₹'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Reason */}
      <div className="mb-4">
        <label htmlFor="discountReason" className="block text-sm font-medium text-gray-700 mb-1">
          Reason for Adjustment (Optional)
        </label>
        <textarea
          id="discountReason"
          value={discountReason}
          onChange={(e) => setDiscountReason(e.target.value)}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter reason for price adjustment..."
          rows={2}
        />
      </div>

      {/* Price Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Original Total:</span>
          <span className="font-medium">₹{totalOriginalPrice.toFixed(2)}</span>
        </div>
        
        {totalDiscount > 0 && (
          <div className="flex justify-between mb-2 text-green-600">
            <span>Discount:</span>
            <span className="font-medium">
              -₹{totalDiscount.toFixed(2)} ({discountPercentage.toFixed(1)}%)
            </span>
          </div>
        )}
        
        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
          <span className="font-semibold text-gray-800">Final Price:</span>
          <span className="font-bold text-lg text-blue-600">
            ₹{finalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Individual Item Price Adjustments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setShowItemPrices(!showItemPrices)}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {showItemPrices ? 'Hide' : 'Show'} Individual Item Prices
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform ${showItemPrices ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showItemPrices && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border rounded-md overflow-hidden"
          >
            <ul className="divide-y divide-gray-200">
              {cart.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800 mr-2">{item.name}</span>
                      <span className="text-gray-500 text-sm">
                        ({item.quantity} {item.unitType})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleItemExpand(item.id)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>

                  {expandedItemId === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 bg-gray-50 p-3 rounded-md"
                    >
                      <div className="flex items-center mb-2">
                        <div className="w-1/2">
                          <label className="block text-xs font-medium text-gray-500">Current Price (per unit)</label>
                          <p className="text-sm font-medium">₹{item.price.toFixed(2)}</p>
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs font-medium text-gray-500">Total</label>
                          <p className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>

                      <div>
                        <label htmlFor={`custom-price-${item.id}`} className="block text-xs font-medium text-gray-500 mb-1">
                          Custom Price (per unit)
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            id={`custom-price-${item.id}`}
                            value={item.customPrice !== undefined ? item.customPrice : item.price}
                            onChange={(e) => handleItemPriceUpdate(item.id, Math.max(0, parseFloat(e.target.value) || 0))}
                            className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                          />
                          <button
                            type="button"
                            onClick={() => handleItemPriceUpdate(item.id, item.price)}
                            className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WholesalePriceCustomizer;