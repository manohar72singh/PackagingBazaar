import { createContext, useContext, useReducer, useEffect } from "react";
import { useNotification } from "./NotificationContext";
import { fetchCartAPI, addToCartAPI, removeFromCartAPI, syncCartAPI, clearCartAPI } from "../services/cartServices";

const CartContext = createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD": {
      // Create a unique key based on product + specs (not quantity)
      const attrKey = `${action.product.id}-${action.product.seller_id}-${action.product.selected_thickness || ""}-${action.product.selected_width || ""}-${action.product.selected_brand || ""}`;
      
      const exists = state.find((i) => {
        const iKey = `${i.id}-${i.seller_id}-${i.selected_thickness || ""}-${i.selected_width || ""}-${i.selected_brand || ""}`;
        return iKey === attrKey;
      });

      if (exists) {
        // Same product+specs → just update inquiry_quantity
        return state.map((i) => {
          const iKey = `${i.id}-${i.seller_id}-${i.selected_thickness || ""}-${i.selected_width || ""}-${i.selected_brand || ""}`;
          return iKey === attrKey 
            ? { ...i, inquiry_quantity: action.product.inquiry_quantity || i.inquiry_quantity } 
            : i;
        });
      }
      // New entry → always qty=1 (B2B: 1 item per unique spec)
      return [...state, { ...action.product, qty: 1 }];
    }
    case "REMOVE": {
      return state.filter((i) => {
        if (action.cart_id && i.cart_id === action.cart_id) return false;
        if (action.local_id && i.local_id === action.local_id) return false;
        return true;
      });
    }
    case "UPDATE_INQUIRY_QTY": {
      return state.map((i) => {
        const isMatch = (action.cart_id && i.cart_id === action.cart_id) || 
                        (action.local_id && i.local_id === action.local_id);
        return isMatch ? { ...i, inquiry_quantity: action.inquiry_quantity } : i;
      });
    }
    case "UPDATE_ITEM_MESSAGE": {
      return state.map((i) => {
        const isMatch = (action.cart_id && i.cart_id === action.cart_id) || 
                        (action.local_id && i.local_id === action.local_id);
        return isMatch ? { ...i, specific_message: action.specific_message } : i;
      });
    }
    case "CLEAR": return [];
    case "SET_CART": return action.cart;
    default: return state;
  }
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(reducer, JSON.parse(localStorage.getItem("cart")) || []);
  const token = localStorage.getItem("token");
  const { notifySuccess, notifyError } = useNotification();

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!token) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, token]);

  // Sync / Fetch cart on mount or login
  useEffect(() => {
    if (token) {
      const loadAndSync = async () => {
        try {
          const localItems = JSON.parse(localStorage.getItem("cart")) || [];
          if (localItems.length > 0) {
            localStorage.removeItem("cart"); // Clear BEFORE sync to prevent React Strict Mode duplicate calls
            await syncCartAPI(localItems.map(i => ({ 
              id: i.id, 
              seller_id: i.seller_id,
              qty: 1,
              thickness: i.selected_thickness,
              width: i.selected_width,
              brand: i.selected_brand,
              inquiry_quantity: i.inquiry_quantity || "",
              specific_message: i.specific_message || ""
            })));
          }
          const res = await fetchCartAPI();
          if (res.success) {
            // Transform backend products to context format
            const transformed = res.cart.map(i => ({
              cart_id: i.cart_id,
              id: i.product_id,
              name: i.name,
              price: i.price,
              qty: 1,
              image: i.image,
              selected_thickness: i.selected_thickness,
              selected_width: i.selected_width,
              selected_brand: i.selected_brand,
              inquiry_quantity: i.inquiry_quantity || "",
              specific_message: i.specific_message || "",
              unit: i.unit,
              color: i.color,
              seller_id: i.seller_id,
              seller_uid: i.seller_uid,
            }));
            dispatch({ type: "SET_CART", cart: transformed });
          }
        } catch (err) {
          console.error("Cart sync failed:", err);
        }
      };
      loadAndSync();
    }
  }, [token]);

  const addToCart = async (p) => {
    // Normalize product for consistency (Guest cart use case)
    const normalizedItem = {
      ...p,
      id: p.id,
      name: p.name,
      price: p.price || p.min_price,
      image: p.image || p.image_url,
      unit: p.unit,
      color: p.color,
      seller_id: p.seller_id,
      seller_uid: p.seller_uid,
      inquiry_quantity: p.selected_quantity || p.inquiry_quantity || "",
      specific_message: p.specific_message || "",
      local_id: `${p.id}-${p.seller_id}-${p.selected_thickness || ""}-${p.selected_width || ""}-${p.selected_brand || ""}`
    };
    
    dispatch({ type: "ADD", product: normalizedItem });
    notifySuccess("Requirement added!");
    
    if (token) {
      try {
        await addToCartAPI(p.id, 1, {
          sellerId: p.seller_id,
          thickness: p.selected_thickness,
          width: p.selected_width,
          brand: p.selected_brand,
          inquiryQuantity: p.selected_quantity || p.inquiry_quantity || "",
          specificMessage: p.specific_message || ""
        });
        // Refresh cart to get real cart_ids from backend
        const res = await fetchCartAPI();
        if (res.success) {
           const transformed = res.cart.map(i => ({
              cart_id: i.cart_id,
              id: i.product_id,
              name: i.name,
              price: i.price,
              qty: 1,
              image: i.image,
              selected_thickness: i.selected_thickness,
              selected_width: i.selected_width,
              selected_brand: i.selected_brand,
              inquiry_quantity: i.inquiry_quantity,
              specific_message: i.specific_message || "",
              unit: i.unit,
              color: i.color,
              seller_id: i.seller_id,
              seller_uid: i.seller_uid,
            }));
            dispatch({ type: "SET_CART", cart: transformed });
        }
      } catch (err) { console.error(err); }
    }
  };

  const removeFromCart = async (item) => {
    dispatch({ type: "REMOVE", cart_id: item.cart_id, local_id: item.local_id });
    if (token && item.cart_id) {
      try { await removeFromCartAPI(item.cart_id); } catch (err) { console.error(err); }
    }
  };

  const updateInquiryQty = async (item, inquiry_quantity) => {
    dispatch({ type: "UPDATE_INQUIRY_QTY", cart_id: item.cart_id, local_id: item.local_id, inquiry_quantity });
    if (token && item.id) {
      try { 
        await addToCartAPI(item.id, 1, {
          sellerId: item.seller_id,
          thickness: item.selected_thickness,
          width: item.selected_width,
          brand: item.selected_brand,
          inquiryQuantity: inquiry_quantity,
          specificMessage: item.specific_message || ""
        }); 
      } catch (err) { 
        notifyError("Update failed");
        console.error(err); 
      }
    }
  };

  const updateItemMessage = async (item, specific_message) => {
    dispatch({ type: "UPDATE_ITEM_MESSAGE", cart_id: item.cart_id, local_id: item.local_id, specific_message });
    if (token && item.id) {
      try {
        await addToCartAPI(item.id, 1, {
          sellerId: item.seller_id,
          thickness: item.selected_thickness,
          width: item.selected_width,
          brand: item.selected_brand,
          inquiryQuantity: item.inquiry_quantity,
          specificMessage: specific_message
        });
      } catch (err) {
        console.error("Failed to update message in backend:", err);
      }
    }
  };

  const clearCart = async () => {
    dispatch({ type: "CLEAR" });
    if (token) {
      try { await clearCartAPI(); } catch (err) { console.error(err); }
    }
  };

  const total = cart.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const count = cart.length; // Number of unique product entries

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateInquiryQty, updateItemMessage, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
