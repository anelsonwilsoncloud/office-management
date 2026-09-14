import { Injectable } from '@angular/core';
import { Todo, TodoReminder } from './models';

@Injectable({ providedIn: 'root' })
export class TodoReminderService {
  private readonly storageKey = 'office-management.todo-reminders';
  private readonly reminders = new Map<number, TodoReminder>();
  private readonly timers = new Map<number, number>();
  private initialized = false;
  private audioContext: AudioContext | null = null;

  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.load();
  }

  get(todoId: number): TodoReminder | null {
    this.init();
    return this.reminders.get(todoId) ?? null;
  }

  list(): TodoReminder[] {
    this.init();
    return Array.from(this.reminders.values()).sort((a, b) => {
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
  }

  syncTodo(todo: Todo): void {
    this.init();
    const reminder = this.reminders.get(todo.id);
    if (!reminder) {
      return;
    }
    if (reminder.todoName !== todo.name) {
      reminder.todoName = todo.name;
      this.save();
    }
  }

  async schedule(todo: Todo, hoursFromNow: number): Promise<void> {
    this.init();
    const hours = Number(hoursFromNow);
    if (!Number.isFinite(hours) || hours < 0.5 || Math.abs(hours * 2 - Math.round(hours * 2)) > 1e-6) {
      throw new Error('Please choose a reminder in 30-minute steps.');
    }

    const permission = await this.ensureNotificationPermission();
    await this.unlockAudio();

    const reminder: TodoReminder = {
      todoId: todo.id,
      todoName: todo.name,
      dueAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    this.reminders.set(todo.id, reminder);
    this.save();
    this.scheduleTimer(reminder);

    if (permission === 'denied') {
      // We still keep the reminder; the due-time fallback will use an alert.
      return;
    }
  }

  cancel(todoId: number): void {
    this.init();
    this.clearTimer(todoId);
    if (this.reminders.delete(todoId)) {
      this.save();
    }
  }

  private load(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as TodoReminder[];
      for (const reminder of parsed) {
        if (reminder && typeof reminder.todoId === 'number' && reminder.dueAt) {
          this.reminders.set(reminder.todoId, reminder);
          this.scheduleTimer(reminder);
        }
      }
    } catch {
      window.localStorage.removeItem(this.storageKey);
    }
  }

  private save(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(this.list()));
  }

  private scheduleTimer(reminder: TodoReminder): void {
    this.clearTimer(reminder.todoId);
    const delay = Math.max(1000, new Date(reminder.dueAt).getTime() - Date.now());
    const timerId = window.setTimeout(() => this.fire(reminder.todoId), delay);
    this.timers.set(reminder.todoId, timerId);
  }

  private clearTimer(todoId: number): void {
    const timerId = this.timers.get(todoId);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.timers.delete(todoId);
    }
  }

  private async fire(todoId: number): Promise<void> {
    const reminder = this.reminders.get(todoId);
    if (!reminder) {
      return;
    }

    this.cancel(todoId);
    await this.playBeep();
    this.showNotification(reminder);
  }

  private showNotification(reminder: TodoReminder): void {
    const title = 'TODO reminder';
    const body = `${reminder.todoName} is due now.`;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, { body });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      window.setTimeout(() => notification.close(), 8000);
      return;
    }

    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${body}`);
    }
  }

  private async ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'default') {
      try {
        return await Notification.requestPermission();
      } catch {
        return Notification.permission;
      }
    }
    return Notification.permission;
  }

  private async unlockAudio(): Promise<void> {
    if (typeof window === 'undefined' || !window.AudioContext) {
      return;
    }
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        // Ignore; the notification will still fire.
      }
    }
  }

  private async playBeep(): Promise<void> {
    if (!this.audioContext) {
      return;
    }

    const context = this.audioContext;
    const now = context.currentTime;
    const scheduleTone = (frequency: number, startOffset: number) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.2, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + 0.22);
      oscillator.stop(now + startOffset + 0.25);
    };

    try {
      if (context.state === 'suspended') {
        await context.resume();
      }
      scheduleTone(880, 0);
      scheduleTone(660, 0.18);
    } catch {
      // Ignore audio failures; the visual notification still works.
    }
  }
}
