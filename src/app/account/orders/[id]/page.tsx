"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getOrder,
  Order,
  formatPrice,
  STORE_NAME,
  getDerivedOrderStatus,
  getDerivedPaymentStatus,
} from "@/lib/medusa";
import {
  ArrowLeft,
  Package,
  Calendar,
  Truck,
  Banknote,
  AlertCircle,
} from "lucide-react";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { customer, token, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !customer && !token) {
      router.push("/account/login");
    }
  }, [customer, token, authLoading, router]);

  useEffect(() => {
    if (!token || !id) return;
    let isCurrent = true;

    getOrder(id, token)
      .then((ord) => {
        if (!isCurrent) return;
        if (ord) {
          setOrder(ord);
        } else {
          setError("Order not found or does not belong to this merchant.");
        }
      })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        console.error("Order load error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load order details from backend.");
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, id]);

  if (authLoading || loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500 font-medium">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center border border-dashed border-zinc-200 rounded-xl space-y-4">
        <AlertCircle size={40} className="mx-auto text-rose-500" />
        <h1 className="text-base font-bold text-zinc-900">Unable to load order</h1>
        <p className="text-xs text-zinc-500">
          {error || "The order could not be found for this merchant."}
        </p>
        <Link
          href="/account"
          className="inline-block text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-md"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const currency = order.currency_code || "TND";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black mb-3 transition"
        >
          <ArrowLeft size={14} /> Back to My Orders
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-zinc-900 font-mono">
                Order #{order.display_id ?? order.id}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                {getDerivedOrderStatus(order)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
              <Calendar size={13} /> Placed on{" "}
              {new Date(order.created_at).toLocaleDateString(undefined, {
                dateStyle: "long",
              })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
              Total Amount
            </span>
            <span className="text-xl font-bold font-mono text-zinc-900">
              {formatPrice(order.total, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="p-6 space-y-6">
          {/* Ordered Line Items */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-3 flex items-center gap-1.5">
              <Package size={16} />
              <span>Items ({items.length})</span>
            </h2>
            <div className="divide-y divide-zinc-100 border-y border-zinc-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{item.title}</p>
                    <p className="text-xs text-zinc-500">
                      Qty: {item.quantity} &bull; Unit: {formatPrice(item.unit_price, currency)}
                    </p>
                  </div>
                  <div className="font-mono font-semibold text-zinc-900">
                    {formatPrice(item.total || item.unit_price * item.quantity, currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Payment Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs">
            <div className="space-y-1">
              <h3 className="font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5 mb-1">
                <Truck size={14} /> Shipping Information
              </h3>
              {order.shipping_address ? (
                <div className="text-zinc-600 space-y-0.5">
                  <p className="font-semibold text-zinc-900">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p>{order.shipping_address.address_1}</p>
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.postal_code}
                  </p>
                  <p>Method: {order.shipping_methods?.[0]?.name || "Standard Tunisia"}</p>
                  <p>Phone: {order.shipping_address.phone}</p>
                </div>
              ) : (
                <p className="text-zinc-400">Standard address</p>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5 mb-1">
                <Banknote size={14} /> Payment & Fulfillment
              </h3>
              <div className="text-zinc-600 space-y-0.5">
                <p>Merchant: <strong>{STORE_NAME}</strong></p>
                <p>{getDerivedPaymentStatus(order)}</p>
                <p>Fulfillment: {getDerivedOrderStatus(order)}</p>
                <p>Contact: {order.email}</p>
              </div>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="pt-4 border-t border-zinc-200 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Items</span>
              <span className="font-mono">
                {formatPrice(
                  order.item_subtotal ??
                    (order.shipping_subtotal
                      ? order.subtotal - order.shipping_subtotal
                      : order.subtotal),
                  currency
                )}
              </span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Shipping</span>
              <span className="font-mono">
                {formatPrice(order.shipping_subtotal ?? 0, currency)}
              </span>
            </div>
            {order.tax_total !== undefined && order.tax_total > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>VAT</span>
                <span className="font-mono">
                  {formatPrice(order.tax_total, currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-200">
              <span>Total</span>
              <span className="font-mono">{formatPrice(order.total, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
