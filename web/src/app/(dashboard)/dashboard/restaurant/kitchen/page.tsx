"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Simulation of fetching pending orders
const MOCK_ORDERS = [
  {
    id: "o1",
    table: "Table 4",
    time: "5 mins ago",
    items: [
      { id: "i1", name: "Jollof Rice with Chicken", quantity: 2, status: "pending" },
      { id: "i2", name: "Fresh Juice", quantity: 2, status: "pending" },
    ],
  },
  {
    id: "o2",
    table: "Table 1",
    time: "2 mins ago",
    items: [
      { id: "i3", name: "Grilled Fish", quantity: 1, status: "cooking" },
      { id: "i4", name: "Side Salad", quantity: 1, status: "pending" },
    ],
  },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  function updateItemStatus(orderId: string, itemId: string, newStatus: string) {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        items: order.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, status: newStatus };
        })
      };
    }));
    toast.success(`Item status updated to ${newStatus}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Display System (KDS)</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage live food orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            Live Updates Active
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {orders.map((order) => (
          <Card key={order.id} className="flex flex-col border-2">
            <CardHeader className="bg-muted/50 pb-3 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  {order.table}
                </CardTitle>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {order.time}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <span className="font-bold text-lg text-primary">{item.quantity}x</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Badge variant={item.status === 'pending' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                        {item.status}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {item.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs h-8"
                          onClick={() => updateItemStatus(order.id, item.id, 'cooking')}
                        >
                          Start Cooking
                        </Button>
                      )}
                      {item.status === 'cooking' && (
                        <Button 
                          size="sm" 
                          className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700"
                          onClick={() => updateItemStatus(order.id, item.id, 'served')}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Served
                        </Button>
                      )}
                      {item.status === 'served' && (
                        <div className="flex-1 text-center py-1 text-xs font-medium text-green-600 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
