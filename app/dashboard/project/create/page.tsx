'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { PROJECT_COLORS } from '@/lib/PROJECT_COLORS';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(PROJECT_COLORS[4].value);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    clientContact: '',
    budget: '',
    deadline: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          color: selectedColor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания проекта');
      }

      // Перенаправляем на страницу проекта
      router.push(`/dashboard/projects/${data.project.slug}`);
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Создание проекта</CardTitle>
          <CardDescription className="text-base">
            Создайте свой проект и настройте рабочее пространство
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название проекта *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Например: Мой первый проект"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Цвет проекта</Label>
                <div className="flex flex-wrap gap-3">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        selectedColor === color.value
                          ? 'scale-110 border-gray-900'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Краткое описание проекта"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Клиент</Label>
                  <Input
                    id="clientName"
                    name="clientName"
                    placeholder="Имя клиента"
                    value={formData.clientName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientContact">Контакт клиента</Label>
                  <Input
                    id="clientContact"
                    name="clientContact"
                    placeholder="Контакт клиента"
                    value={formData.clientContact}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget">Бюджет</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    placeholder="50000"
                    value={formData.budget}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Дедлайн</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? 'Создаём...' : 'Создать проект'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
