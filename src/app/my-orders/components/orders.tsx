"use client";

import { Package2 } from "lucide-react";
import Image from "next/image";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { orderTable } from "@/db/schema";

interface OrderItem {
  id: string;
  imageUrl: string;
  productName: string;
  productVariantName: string;
  quantity: number;
  priceInCents: number;
  createdAt: Date | string | number;
}

interface OrderUI {
  createdAt: string | number | Date;
  id: string;
  totalPriceInCents: number;
  status: (typeof orderTable.$inferInsert)["status"];
  items: OrderItem[];
}

interface OrderProps {
  orders: OrderUI[];
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatOrderNumber(index: number) {
  return `#${(index + 1).toString().padStart(3, "0")}`;
}

function ItemRow({ item }: { item: OrderItem }) {
  const price = currency.format(item.priceInCents / 100);
  return (
    <div className="flex items-start gap-4">
      <div className="relative h-16 w-16 overflow-hidden rounded-xl border bg-white">
        <Image
          src={item.imageUrl}
          alt={item.productName}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="grid flex-1">
        <span className="text-sm font-semibold text-slate-900">
          {item.productName}
        </span>
        <span className="text-xs text-slate-500">
          {item.productVariantName} • Qtd: {item.quantity}
        </span>
      </div>
      <div className="text-sm font-semibold">{price}</div>
    </div>
  );
}

export default function Orders({ orders }: OrderProps) {
  if (!orders?.length) {
    return (
      <div className="px-4">
        <Card className="rounded-2xl border-slate-200 shadow-xl">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Package2 className="h-8 w-8" />
            <p className="text-base font-medium">Você ainda não tem pedidos</p>
            <p className="text-sm text-slate-500">
              Assim que você finalizar uma compra, seus pedidos aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-lg font-semibold tracking-tight">Meus pedidos</h1>
      </div>

      <ScrollArea className="h-[calc(100dvh-220px)] pr-1">
        <div className="space-y-4">
          {orders.map((order, idx) => (
            <Card
              key={order.id}
              className="rounded-2xl border-slate-200 shadow-xl"
            >
              <CardContent className="p-0">
                <Accordion
                  type="single"
                  collapsible
                  defaultValue={idx === 1 ? `item-${order.id}` : undefined}
                  className="w-full"
                >
                  <AccordionItem
                    value={`item-${order.id}`}
                    className="border-0"
                  >
                    <AccordionTrigger className="px-4 py-5">
                      <div className="grid text-left">
                        <span className="text-sm font-semibold text-slate-900">
                          Número do Pedido
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatOrderNumber(idx)}
                        </span>
                        <div className="mt-1">
                          {order.status === "paid" && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-500/90">
                              Pago
                            </Badge>
                          )}
                          {order.status === "pending" && (
                            <Badge
                              variant="outline"
                              className="border-amber-600 text-amber-600"
                            >
                              Pagamento pendente
                            </Badge>
                          )}
                          {order.status === "canceled" && (
                            <Badge variant="destructive">Cancelado</Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pt-1 pb-4">
                      <div className="space-y-4">
                        <div className="space-y-4">
                          {order.items.map((item) => (
                            <div key={item.id}>
                              <ItemRow item={item} />
                              <Separator className="my-4 last:hidden" />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3 rounded-xl border bg-white p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Subtotal</span>
                            <span className="font-medium">
                              {currency.format(order.totalPriceInCents / 100)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              Transporte e Manuseio
                            </span>
                            <span className="font-medium">Grátis</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              Taxa Estimada
                            </span>
                            <span className="text-slate-400">—</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Total</span>
                            <span className="text-sm font-extrabold">
                              {currency.format(order.totalPriceInCents / 100)}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Pedido feito em:{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}{" "}
                          as{" "}
                          {new Date(order.createdAt).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}