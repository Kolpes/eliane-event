'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalTicketsSold: 0, capacity: 0 });

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const handleExport = () => {
    window.open('/api/admin/buyers/export', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Inuka</h1>
          <Button onClick={handleExport} className="bg-yellow-600 hover:bg-yellow-700 text-white">
            Exportar Compradores (CSV)
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.totalRevenue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Ingressos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTicketsSold}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Lotação Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-700">
                {stats.capacity > 0 ? Math.round((stats.totalTicketsSold / stats.capacity) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
