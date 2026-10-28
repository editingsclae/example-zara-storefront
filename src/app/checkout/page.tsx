"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {
  formatPrice,
  getShippingOptions,
  addShippingMethod,
  updateCart,
  createPaymentCollection,
  createPaymentSession,
  completeCart,
  linkCartToCustomer,
  ShippingOption,
  Address,
} from "@/lib/medusa";
import {
  CheckCircle,
  Truck,
  Banknote,
  AlertCircle,
  Lock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { rememberGuestOrder } from "@/lib/guest-orders";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, refreshCart, clearCart, isLoading: cartLoading } = useCart();
  const { customer, token } = useAuth();
  const [, startTransition] = useTransition();

  // Form states
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<Address>({
    first_name: "",
    last_name: "",
    address_1: "",
    address_2: "",
    city: "Tunis",
    country_code: "tn",
    postal_code: "1000",
    phone: "",
  });

  // Flow states
  const [step, setStep] = useState<"address" | "shipping" | "payment">("address");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string>("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Autofill customer data if logged in
  useEffect(() => {
    if (!customer) return;
    const timer = setTimeout(() => {
      setEmail((prev) => prev || customer.email || "");
      setAddress((prev) => ({
        ...prev,
        first_name: prev.first_name || customer.first_name || "",
        last_name: prev.last_name || customer.last_name || "",
        phone: prev.phone || customer.phone || "",
      }));
    }, 0);
    return () => clearTimeout(timer);
  }, [customer]);

  const currencyCode = cart?.currency_code || "TND";
  const items = cart?.items || [];

  // Validation function
  const validateAddress = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "Email address is required.";
    }

    if (!address.first_name.trim()) {
      errors.first_name = "First name is required.";
    }

    if (!address.last_name.trim()) {
      errors.last_name = "Last name is required.";
    }

    if (!address.address_1.trim()) {
      errors.address_1 = "Address is required.";
    }

    // City is required
    if (!address.city || !address.city.trim()) {
      errors.city = "City is required.";
    }

    // Phone is required: at least 8 digits, allow +216 prefix, spaces ignored
    const rawPhone = address.phone || "";
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, "");
    const phonePattern = /^(\+?216)?[0-9]{8,}$/;
    if (!rawPhone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!phonePattern.test(cleanPhone)) {
      errors.phone = "Phone number must have at least 8 digits (e.g. 12 345 678 or +216 12 345 678).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Save Address and Load Shipping Options
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart) return;

    if (!validateAddress()) {
      return; // Do NOT call the API until valid
    }

    setErrorMessage(null);
    setShippingLoading(true);

    try {
      // 1. Update cart with email and address
      await updateCart(
        cart.id,
        {
          email,
          shipping_address: address,
          billing_address: address,
        },
        token || undefined
      );

      // 2. Fetch shipping options
      const options = await getShippingOptions(cart.id);
      setShippingOptions(options);

      if (options.length > 0) {
        setSelectedShippingOptionId(options[0].id);
      }
      await refreshCart();
      setStep("shipping");
    } catch (err: unknown) {
      console.error("Address save error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(
        msg || "Failed to update shipping address. Please check your details."
      );
    } finally {
      setShippingLoading(false);
    }
  };

  // Step 2: Confirm Shipping Method
  const handleConfirmShipping = async () => {
    if (!cart || !selectedShippingOptionId) return;
    setErrorMessage(null);
    setShippingLoading(true);

    try {
      await addShippingMethod(
        cart.id,
        selectedShippingOptionId,
        token || undefined
      );
      await refreshCart();
      setStep("payment");
    } catch (err: unknown) {
      console.error("Shipping method error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("shipping profile")) {
        setErrorMessage(
          "The cart items require shipping profiles that are not satisfied by the merchant. Please contact store support."
        );
      } else {
        setErrorMessage(msg || "Failed to add shipping method.");
      }
    } finally {
      setShippingLoading(false);
    }
  };

  // Step 3: Complete Order
  const handlePlaceOrder = async () => {
    if (!cart) return;
    setErrorMessage(null);
    setSubmittingOrder(true);

    try {
      // If customer token exists and cart has no customer_id, link cart to customer, then refresh cart
      if (token && cart && !cart.customer_id) {
        try {
          await linkCartToCustomer(cart.id, token);
          await refreshCart();
        } catch (linkErr) {
          console.warn("Pre-order cart link warning:", linkErr);
        }
      }

      // 1. Create payment collection
      const paymentCollection = await createPaymentCollection(
        cart.id,
        token || undefined
      );

      // 2. Create payment session (verified provider: pp_system_default)
      await createPaymentSession(
        paymentCollection.id,
        "pp_system_default",
        token || undefined
      );

      // 3. Complete cart
      const result = await completeCart(cart.id, token || undefined);

      if (result.type === "order" && result.order) {
        const orderId = result.order.id;
        // A guest can claim this order later, when they log in or register
        if (!token) {
          rememberGuestOrder(orderId);
        }
        clearCart();
        startTransition(() => {
          router.push(`/order/confirmed/${orderId}`);
        });
      } else {
        throw new Error("Cart completion did not return an order.");
      }
    } catch (err: unknown) {
      console.error("Place order failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("shipping profile")) {
        setErrorMessage(
          "The cart items require shipping profiles that are not satisfied by the merchant. Please contact store support."
        );
      } else {
        setErrorMessage(
          msg || "An unexpected error occurred while placing your order."
        );
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (cartLoading && !cart) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500 font-medium">Preparing checkout...</p>
      </div>
    );
  }

  if (!cart || items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center border border-dashed border-zinc-200 rounded-xl space-y-4">
        <AlertCircle size={40} className="mx-auto text-zinc-400" />
        <h1 className="text-lg font-bold text-zinc-900">Cart is empty</h1>
        <p className="text-xs text-zinc-500">
          You cannot checkout without any items in your cart.
        </p>
        <Link
          href="/"
          className="inline-block text-xs font-semibold px-4 py-2 rounded-md bg-zinc-900 text-white hover:bg-black transition"
        >
          Return to store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Checkout Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black mb-1 transition"
          >
            <ArrowLeft size={14} /> Back to Cart
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            Secure Checkout
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <Lock size={13} />
          <span>SSL Encrypted</span>
        </div>
      </div>

      {/* Main Grid: Steps on Left, Cart Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">Checkout Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Address & Contact */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-zinc-50 p-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="font-bold text-sm text-zinc-900">
                  Contact & Shipping Address
                </h2>
              </div>
              {step !== "address" && (
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="text-xs text-zinc-600 hover:text-black font-semibold underline"
                >
                  Edit
                </button>
              )}
            </div>

            {step === "address" ? (
              <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => {
                          const n = { ...prev };
                          delete n.email;
                          return n;
                        });
                      }
                    }}
                    placeholder="shopper@example.com"
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                      fieldErrors.email
                        ? "border-rose-500 focus:ring-rose-500"
                        : "border-zinc-300 focus:ring-zinc-900"
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.email}</p>
                  )}
                  {!customer && (
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Already have an account?{" "}
                      <Link href="/account/login" className="underline font-semibold">
                        Sign in for faster checkout
                      </Link>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address.first_name}
                      onChange={(e) => {
                        setAddress({ ...address, first_name: e.target.value });
                        if (fieldErrors.first_name) {
                          setFieldErrors((prev) => {
                            const n = { ...prev };
                            delete n.first_name;
                            return n;
                          });
                        }
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                        fieldErrors.first_name
                          ? "border-rose-500 focus:ring-rose-500"
                          : "border-zinc-300 focus:ring-zinc-900"
                      }`}
                    />
                    {fieldErrors.first_name && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address.last_name}
                      onChange={(e) => {
                        setAddress({ ...address, last_name: e.target.value });
                        if (fieldErrors.last_name) {
                          setFieldErrors((prev) => {
                            const n = { ...prev };
                            delete n.last_name;
                            return n;
                          });
                        }
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                        fieldErrors.last_name
                          ? "border-rose-500 focus:ring-rose-500"
                          : "border-zinc-300 focus:ring-zinc-900"
                      }`}
                    />
                    {fieldErrors.last_name && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.last_name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.address_1}
                    onChange={(e) => {
                      setAddress({ ...address, address_1: e.target.value });
                      if (fieldErrors.address_1) {
                        setFieldErrors((prev) => {
                          const n = { ...prev };
                          delete n.address_1;
                          return n;
                        });
                      }
                    }}
                    placeholder="Street name, apartment, building"
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                      fieldErrors.address_1
                        ? "border-rose-500 focus:ring-rose-500"
                        : "border-zinc-300 focus:ring-zinc-900"
                    }`}
                  />
                  {fieldErrors.address_1 && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.address_1}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => {
                        setAddress({ ...address, city: e.target.value });
                        if (fieldErrors.city) {
                          setFieldErrors((prev) => {
                            const n = { ...prev };
                            delete n.city;
                            return n;
                          });
                        }
                      }}
                      placeholder="e.g. Tunis"
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                        fieldErrors.city
                          ? "border-rose-500 focus:ring-rose-500"
                          : "border-zinc-300 focus:ring-zinc-900"
                      }`}
                    />
                    {fieldErrors.city && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={address.postal_code}
                      onChange={(e) =>
                        setAddress({ ...address, postal_code: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Tunisia (TN)"
                      className="w-full px-3 py-2 text-sm border border-zinc-200 bg-zinc-100 text-zinc-600 rounded-md cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => {
                      setAddress({ ...address, phone: e.target.value });
                      if (fieldErrors.phone) {
                        setFieldErrors((prev) => {
                          const n = { ...prev };
                          delete n.phone;
                          return n;
                        });
                      }
                    }}
                    placeholder="+216 12 345 678"
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                      fieldErrors.phone
                        ? "border-rose-500 focus:ring-rose-500"
                        : "border-zinc-300 focus:ring-zinc-900"
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.phone}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={shippingLoading}
                  className="w-full py-3 px-4 bg-zinc-900 text-white rounded-md font-semibold text-xs uppercase tracking-wider hover:bg-black disabled:bg-zinc-300 transition"
                >
                  {shippingLoading ? "Saving Address..." : "Continue to Delivery Method"}
                </button>
              </form>
            ) : (
              <div className="p-4 text-xs text-zinc-600 flex justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">
                    {address.first_name} {address.last_name} ({email})
                  </p>
                  <p>{address.address_1}, {address.city} {address.postal_code}</p>
                  <p>Tunisia &bull; {address.phone}</p>
                </div>
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
            )}
          </div>

          {/* STEP 2: Shipping Method */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-zinc-50 p-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-bold text-sm text-zinc-900">
                  Shipping Option
                </h2>
              </div>
              {step === "payment" && (
                <button
                  type="button"
                  onClick={() => setStep("shipping")}
                  className="text-xs text-zinc-600 hover:text-black font-semibold underline"
                >
                  Edit
                </button>
              )}
            </div>

            {step === "shipping" && (
              <div className="p-6 space-y-4">
                {shippingOptions.length === 0 ? (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                    <p className="font-bold">Shipping is not set up yet</p>
                    <p>
                      No delivery options were found for this merchant cart. Please check backend fulfillment configuration.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shippingOptions.map((opt) => {
                      const isSelected = opt.id === selectedShippingOptionId;
                      const optPrice =
                        opt.calculated_price?.calculated_amount ?? opt.amount;

                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition ${
                            isSelected
                              ? "border-black bg-zinc-50 ring-1 ring-black"
                              : "border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping_option"
                              checked={isSelected}
                              onChange={() => setSelectedShippingOptionId(opt.id)}
                              className="text-black focus:ring-black"
                            />
                            <div>
                              <p className="font-semibold text-sm text-zinc-900">
                                {opt.name}
                              </p>
                              <p className="text-xs text-zinc-500">
                                Standard Tunisia Delivery
                              </p>
                            </div>
                          </div>
                          <div className="font-bold text-sm text-zinc-900 font-mono">
                            {formatPrice(optPrice, currencyCode)}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmShipping}
                  disabled={shippingLoading || shippingOptions.length === 0}
                  className="w-full py-3 px-4 bg-zinc-900 text-white rounded-md font-semibold text-xs uppercase tracking-wider hover:bg-black disabled:bg-zinc-300 transition"
                >
                  {shippingLoading ? "Updating Shipping..." : "Continue to Payment"}
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="p-4 text-xs text-zinc-600 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-zinc-500" />
                  <span>
                    Selected:{" "}
                    <strong>
                      {shippingOptions.find((o) => o.id === selectedShippingOptionId)?.name ||
                        "Standard Shipping"}
                    </strong>
                  </span>
                </div>
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
            )}
          </div>

          {/* STEP 3: Payment & Place Order */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-zinc-50 p-4 border-b border-zinc-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h2 className="font-bold text-sm text-zinc-900">
                Payment & Order Placement
              </h2>
            </div>

            {step === "payment" ? (
              <div className="p-6 space-y-6">
                <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50 flex items-start gap-3">
                  <Banknote size={20} className="text-zinc-700 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-zinc-900">
                      Cash on delivery
                    </p>
                    <p className="text-xs text-zinc-600">
                      Pay when you receive your order
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={submittingOrder}
                    className="w-full py-4 px-6 bg-zinc-900 text-white rounded-md font-bold text-sm uppercase tracking-wider hover:bg-black disabled:bg-zinc-300 transition shadow"
                  >
                    {submittingOrder ? "Placing Order..." : "Place Order Now"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-xs text-zinc-400 italic">
                Complete shipping selection to proceed to payment.
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-zinc-50 space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900">
            Cart Summary ({items.length})
          </h3>

          <div className="divide-y divide-zinc-200 text-xs">
            {items.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900">{item.title}</p>
                  <p className="text-zinc-500 font-mono">Qty: {item.quantity}</p>
                </div>
                <div className="font-mono font-semibold text-zinc-900">
                  {formatPrice(item.subtotal || item.unit_price * item.quantity, currencyCode)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-200 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Items</span>
              <span className="font-mono font-semibold text-zinc-900">
                {formatPrice(
                  cart.item_subtotal ??
                    (cart.shipping_subtotal
                      ? cart.subtotal - cart.shipping_subtotal
                      : cart.subtotal),
                  currencyCode
                )}
              </span>
            </div>

            <div className="flex justify-between text-zinc-600">
              <span>Shipping</span>
              <span className="font-mono text-zinc-900">
                {cart.shipping_subtotal !== undefined && cart.shipping_subtotal > 0 ? (
                  formatPrice(cart.shipping_subtotal, currencyCode)
                ) : (
                  <span className="text-zinc-500 italic font-sans font-normal">
                    Calculated next
                  </span>
                )}
              </span>
            </div>

            {cart.tax_total !== undefined && cart.tax_total > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>VAT</span>
                <span className="font-mono text-zinc-900">
                  {formatPrice(cart.tax_total, currencyCode)}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-zinc-200 flex justify-between text-base font-extrabold text-zinc-900">
              <span>Total</span>
              <span className="font-mono">
                {formatPrice(cart.total || cart.subtotal, currencyCode)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
