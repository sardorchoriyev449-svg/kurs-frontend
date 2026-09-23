'use client';
import React, { useEffect, useState } from 'react';
import { giftsApi, coinsApi } from '@/lib/api';
import { Gift } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Gift as GiftIcon, Coins } from 'lucide-react';

export default function StudentGiftsCatalog() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [gRes, cRes] = await Promise.all([
        giftsApi.getAll(),
        coinsApi.getMe(),
      ]);
      if (gRes.success && gRes.data) setGifts(gRes.data);
      if (cRes.success && cRes.balance !== undefined) setBalance(cRes.balance);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Sovg'alar do'koni</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">To'plangan koinlaringiz evaziga olishingiz mumkin bo'lgan yutuqlar</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-500/15 border border-amber-200/80 dark:border-amber-500/30 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">Sizning balansingiz:</span>
          <span className="text-base font-extrabold text-amber-900 dark:text-amber-200 font-mono">{balance} koin</span>
        </div>
      </div>

      {gifts.length === 0 && !loading ? (
        <EmptyState
          icon={GiftIcon}
          title="Sovg'alar mavjud emas"
          description="Hozircha do'konga sovg'alar kiritilmagan."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gifts.map((gift) => {
            const hasEnough = balance >= gift.price_coin;
            return (
              <div key={gift._id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {gift.price_coin} koin
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Qoldi: {gift.stock} dona</span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{gift.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{gift.description || "Tavsif ko'rsatilmagan"}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    hasEnough
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {hasEnough ? "Yetarli" : `Yana ${gift.price_coin - balance} koin kerak`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}