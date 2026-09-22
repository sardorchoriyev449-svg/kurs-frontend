/**
 * To'lov qilmagan o'quvchilarni guruh bo'yicha muzlatish (suspend) holatini boshqarish
 */

const STORAGE_KEY = 'edu_suspended_students';

export const suspensionManager = {
  // Guruhdagi muzlatilgan studentlar ID larini olish
  getSuspendedIds(groupId: string): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}_${groupId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Student muzlatilganmi yoki yo'qligini tekshirish
  isSuspended(groupId: string, studentId: string): boolean {
    const list = this.getSuspendedIds(groupId);
    return list.includes(studentId);
  },

  // Studentni muzlatish yoki qayta faollashtirish (Toggle)
  toggleSuspension(groupId: string, studentId: string): boolean {
    const list = this.getSuspendedIds(groupId);
    let updated: string[];
    let isNowSuspended = false;

    if (list.includes(studentId)) {
      // Faollashtirish
      updated = list.filter((id) => id !== studentId);
      isNowSuspended = false;
    } else {
      // Muzlatish
      updated = [...list, studentId];
      isNowSuspended = true;
    }

    try {
      localStorage.setItem(`${STORAGE_KEY}_${groupId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    return isNowSuspended;
  },
};