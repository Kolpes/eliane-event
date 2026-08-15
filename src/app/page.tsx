'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-yellow-500/20 py-6 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-yellow-600 uppercase tracking-wider">Inuka</h1>
            <span className="text-xs font-semibold text-slate-500 tracking-widest">Team Blessing</span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Triângulo Milionário
          </h2>
          <p className="text-lg md:text-xl text-slate-600">
            Garanta sua presença no maior evento de líderes e revendedores Inuka. Uma experiência exclusiva e transformadora.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-yellow-50 text-yellow-800 px-6 py-3 rounded-full font-medium border border-yellow-200">
            <span>📅 05 de Setembro de 2026</span>
            <span className="hidden md:inline">•</span>
            <span>🕒 09:00 às 11:00</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Ingressos Disponíveis</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl text-yellow-700">Classic Range</CardTitle>
                <CardDescription>Acesso essencial ao evento</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">10.000 Kz</div>
                <div className="space-y-2 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lotação do Lote</span>
                    <span className="font-medium text-slate-700">75%</span>
                  </div>
                  <Progress value={75} className="h-2 bg-slate-100" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">Comprar Agora</Button>
              </CardFooter>
            </Card>

            <Card className="border-yellow-200 shadow-sm hover:shadow-md transition-shadow bg-yellow-600 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-800 text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMENDADO</div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl text-white">Exclusivo Range</CardTitle>
                <CardDescription className="text-yellow-100">Experiência premium completa</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">15.000 Kz</div>
                <div className="space-y-2 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-100">Lotação do Lote</span>
                    <span className="font-medium text-white">40%</span>
                  </div>
                  <Progress value={40} className="h-2 bg-yellow-800/50" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-white text-yellow-700 hover:bg-slate-100">Comprar Agora</Button>
              </CardFooter>
            </Card>

            <Card className="border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl text-yellow-700">Original Signature</CardTitle>
                <CardDescription>O máximo de exclusividade</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">25.000 Kz</div>
                <div className="space-y-2 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lotação do Lote</span>
                    <span className="font-medium text-slate-700">90%</span>
                  </div>
                  <Progress value={90} className="h-2 bg-slate-100" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">Comprar Agora</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
