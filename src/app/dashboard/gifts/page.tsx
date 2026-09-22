'use client';

import React, { useEffect, useState } from 'react';
import { giftsApi, coinsApi, usersApi } from '@/lib/api';
import { Gift, User } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Coins, Plus, Send, Edit3, Trash2 } from 'lucide-react';

export default function AdminGiftsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'gifts' | 'coins'>('gifts');
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  // Sovg'a yaratish form
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftForm, setGiftForm] = useState({ name: '', price_coin: 0, stock: 1, description: '' });

  // Sovg'a tahrirlash form
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeGift, setActiveGift] = useState<Gift | null>(null);
  const [editGiftForm, setEditGiftForm] = useState({ name: '', price_coin: 0, stock: 1, description: '' });

  // Sovg'a berish (Redeem) form
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [redeemStudentId, setRedeemStudentId] = useState('');
  const [studentBalance, setStudentBalance] = useState<number | null>(null);

  // Qo'lda Coin berish form
  const [coinForm, setCoinForm] = useState({ student_id: '', amount: 0, reason: '' });

  const loadData = async () => {
    const [gRes, sRes] = await Promise.all([
      giftsApi.getAll(),
      usersApi.getStudents(),
    ]);
    if (gRes.success && gRes.data) setGifts(gRes.data);
    if (sRes.success && sRes.data) setStudents(sRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await giftsApi.create(giftForm);
    if (res.success) {
      toast.success("Sovg'a qo'shildi");
      setIsGiftModalOpen(false);
      setGiftForm({ name: '', price_coin: 0, stock: 1, description: '' });
      loadData();
    } else {
      toast.error(res.message || "Xatolik yuz berdi");
    }
  };

  const openEditGift = (gift: Gift) => {
    setActiveGift(gift);
    setEditGiftForm({
      name: gift.name,
      price_coin: gift.price_coin,
      stock: gift.stock,
      description: gift.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGift) return;
    const res = await giftsApi.update(activeGift._id, editGiftForm);
    if (res.success) {
      toast.success("Sovg'a muvaffaqiyatli yangilandi");
      setIsEditModalOpen(false);
      loadData();
    } else {
      toast.error(res.message || "Yangilashda xatolik");
    }
  };

  const handleDeleteGift = async (giftId: string) => {
    if (!confirm("Sovg'ani butunlay o'chirmoqchimisiz?")) return;
    const res = await giftsApi.delete(giftId);
    if (res.success) {
      toast.success("Sovg'a o'chirildi");
      loadData();
    } else {
      toast.error(res.message || "O'chirib bo'lmadi");
    }
  };

  const handleStudentSelectForRedeem = async (studentId: string) => {
    setRedeemStudentId(studentId);
    if (!studentId) {
      setStudentBalance(null);
      return;
    }
    const res = await coinsApi.getStudentBalance(studentId);
    if (res.success && res.data) {
      setStudentBalance(res.data.balance);
    }
  };

  const handleRedeemGift = async () => {
    if (!selectedGift || !redeemStudentId) return;
    const res = await giftsApi.redeem(selectedGift._id, redeemStudentId);
    if (res.success) {
      toast.success("Sovg'a topshirildi!");
      setIsRedeemModalOpen(false);
      loadData();
    } else {
      toast.error(res.message || "Balans yetarli emas yoki zaxirada qolmagan");
    }
  };

  const handleGiveCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinForm.student_id || !coinForm.amount || !coinForm.reason) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    const res = await coinsApi.create({
      student_id: coinForm.student_id,
      amount: Number(coinForm.amount),
      reason: coinForm.reason,
    });
    if (res.success) {
      toast.success("Koinlar muvaffaqiyatli berildi");
      setCoinForm({ student_id: '', amount: 0, reason: '' });
    } else {
      toast.error(res.message || "Koin berishda xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Sovg'alar va Koinlar</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Rag'batlantirish tizimi, do'kon va balanslar</p>
        </div>
        {activeTab === 'gifts' && (
          <Button onClick={() => setIsGiftModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Yangi sovg'a
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('gifts')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'gifts' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Sovg'alar do'koni
        </button>
        <button
          onClick={() => setActiveTab('coins')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'coins' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Koin berish
        </button>
      </div>

      {activeTab === 'gifts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gifts.map((gift) => (
            <div key={gift._id} className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1 font-mono">
                    <Coins className="w-3.5 h-3.5" /> {gift.price_coin} koin
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditGift(gift)}
                      className="p-1 text-zinc-400 hover:text-indigo-600 rounded-md hover:bg-zinc-100"
                      title="Tahrirlash"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGift(gift._id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-zinc-100"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-bold text-zinc-900">{gift.name}</h3>
                <p className="text-xs text-zinc-500 mt-1">{gift.description || "Tavsif yo'q"}</p>
                <span className="text-xs text-zinc-400 block mt-2">Mavjud zaxira: {gift.stock} dona</span>
              </div>
              <div className="mt-5 pt-3 border-t border-zinc-100">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled={gift.stock <= 0}
                  onClick={() => {
                    setSelectedGift(gift);
                    setRedeemStudentId('');
                    setStudentBalance(null);
                    setIsRedeemModalOpen(true);
                  }}
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> O'quvchiga berish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'coins' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs max-w-xl">
          <form onSubmit={handleGiveCoins} className="space-y-4">
            <h3 className="text-base font-bold text-zinc-900">O'quvchiga koin berish yoki ayirish</h3>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">O'quvchini tanlang</label>
              <select
                required
                value={coinForm.student_id}
                onChange={(e) => setCoinForm({ ...coinForm, student_id: e.target.value })}
                className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2"
              >
                <option value="">O'quvchini tanlang</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Koin miqdori (manfiy son ham mumkin: masalan -20)
              </label>
              <input
                type="number"
                required
                value={coinForm.amount || ''}
                onChange={(e) => setCoinForm({ ...coinForm, amount: Number(e.target.value) })}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Sabab / Izoh</label>
              <input
                required
                value={coinForm.reason}
                onChange={(e) => setCoinForm({ ...coinForm, reason: e.target.value })}
                placeholder="Masalan: Faol qatnashgani uchun"
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
            <Button type="submit">Tasdiqlash</Button>
          </form>
        </div>
      )}

      {/* Yangi sovg'a modali */}
      <Modal isOpen={isGiftModalOpen} onClose={() => setIsGiftModalOpen(false)} title="Yangi sovg'a qo'shish">
        <form onSubmit={handleCreateGift} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Sovg'a nomi</label>
            <input
              required
              value={giftForm.name}
              onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Narxi (koin)</label>
              <input
                type="number"
                required
                min="1"
                value={giftForm.price_coin || ''}
                onChange={(e) => setGiftForm({ ...giftForm, price_coin: Number(e.target.value) })}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Zaxira soni</label>
              <input
                type="number"
                required
                min="1"
                value={giftForm.stock || ''}
                onChange={(e) => setGiftForm({ ...giftForm, stock: Number(e.target.value) })}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Tavsif</label>
            <textarea
              rows={2}
              value={giftForm.description}
              onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full">Qo'shish</Button>
        </form>
      </Modal>

      {/* Sovg'ani tahrirlash modali */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Sovg'ani tahrirlash">
        <form onSubmit={handleUpdateGift} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Sovg'a nomi</label>
            <input
              required
              value={editGiftForm.name}
              onChange={(e) => setEditGiftForm({ ...editGiftForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Narxi (koin)</label>
              <input
                type="number"
                required
                min="1"
                value={editGiftForm.price_coin}
                onChange={(e) => setEditGiftForm({ ...editGiftForm, price_coin: Number(e.target.value) })}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Zaxira soni</label>
              <input
                type="number"
                required
                min="0"
                value={editGiftForm.stock}
                onChange={(e) => setEditGiftForm({ ...editGiftForm, stock: Number(e.target.value) })}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Tavsif</label>
            <textarea
              rows={2}
              value={editGiftForm.description}
              onChange={(e) => setEditGiftForm({ ...editGiftForm, description: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full">Saqlash</Button>
        </form>
      </Modal>

      {/* Sovg'a topshirish modali */}
      <Modal isOpen={isRedeemModalOpen} onClose={() => setIsRedeemModalOpen(false)} title={`Sovg'a topshirish: ${selectedGift?.name}`}>
        <div className="space-y-4">
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Narxi:</span>
              <span className="font-bold text-amber-600 font-mono">{selectedGift?.price_coin} koin</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Mavjud zaxira:</span>
              <span className="font-bold text-zinc-900">{selectedGift?.stock} dona</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">O'quvchini tanlang</label>
            <select
              value={redeemStudentId}
              onChange={(e) => handleStudentSelectForRedeem(e.target.value)}
              className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2"
            >
              <option value="">Tanlang</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>

          {studentBalance !== null && (
            <div className={`p-3 rounded-xl text-xs flex justify-between items-center ${
              studentBalance >= (selectedGift?.price_coin || 0)
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <span>O'quvchi balansi:</span>
              <span className="font-bold font-mono">{studentBalance} koin</span>
            </div>
          )}

          <Button
            onClick={handleRedeemGift}
            disabled={!redeemStudentId || (studentBalance !== null && studentBalance < (selectedGift?.price_coin || 0))}
            className="w-full"
          >
            Sovg'ani topshirish
          </Button>
        </div>
      </Modal>
    </div>
  );
}