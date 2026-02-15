import { useState, useMemo } from "react";
import { format, differenceInDays, addMonths, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import Icon from "@/components/ui/icon";

interface Device {
  id: string;
  object: string;
  name: string;
  number: string;
  verificationDate: Date;
  verificationPeriodMonths: number;
}

const DEMO_DEVICES: Device[] = [
  {
    id: "1",
    object: "Цех №1",
    name: "Манометр МП-3У",
    number: "МП-00142",
    verificationDate: new Date(2025, 5, 15),
    verificationPeriodMonths: 12,
  },
  {
    id: "2",
    object: "Лаборатория",
    name: "Термометр ТЛ-4",
    number: "ТЛ-00891",
    verificationDate: new Date(2025, 11, 1),
    verificationPeriodMonths: 24,
  },
  {
    id: "3",
    object: "Склад",
    name: "Весы ВЛ-120",
    number: "ВЛ-00567",
    verificationDate: new Date(2026, 1, 20),
    verificationPeriodMonths: 12,
  },
  {
    id: "4",
    object: "Цех №2",
    name: "Амперметр Э378",
    number: "Э3-01234",
    verificationDate: new Date(2026, 3, 10),
    verificationPeriodMonths: 12,
  },
];

function getExpiryDate(device: Device): Date {
  return addMonths(device.verificationDate, device.verificationPeriodMonths);
}

function getDaysLeft(device: Device): number {
  return differenceInDays(getExpiryDate(device), new Date());
}

function getStatusBadge(daysLeft: number) {
  if (daysLeft < 0)
    return (
      <Badge variant="destructive" className="font-medium">
        Просрочен
      </Badge>
    );
  if (daysLeft <= 30)
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium">
        Скоро
      </Badge>
    );
  return (
    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
      Действует
    </Badge>
  );
}

const Index = () => {
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    object: "",
    name: "",
    number: "",
    verificationDate: "",
    verificationPeriodMonths: "12",
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return devices.filter(
      (d) =>
        d.object.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.number.toLowerCase().includes(q)
    );
  }, [devices, search]);

  const stats = useMemo(() => {
    const total = devices.length;
    const expired = devices.filter((d) => getDaysLeft(d) < 0).length;
    const expiringSoon = devices.filter((d) => {
      const dl = getDaysLeft(d);
      return dl >= 0 && dl <= 30;
    }).length;
    const active = total - expired - expiringSoon;
    return { total, expired, expiringSoon, active };
  }, [devices]);

  const calendarDates = useMemo(() => {
    const expiring: Date[] = [];
    const expired: Date[] = [];
    const normal: Date[] = [];
    devices.forEach((d) => {
      const exp = getExpiryDate(d);
      const dl = getDaysLeft(d);
      if (dl < 0) expired.push(exp);
      else if (dl <= 30) expiring.push(exp);
      else normal.push(exp);
    });
    return { expiring, expired, normal };
  }, [devices]);

  const handleSubmit = () => {
    if (
      !formData.object ||
      !formData.name ||
      !formData.number ||
      !formData.verificationDate
    )
      return;

    const newDevice: Device = {
      id: Date.now().toString(),
      object: formData.object,
      name: formData.name,
      number: formData.number,
      verificationDate: new Date(formData.verificationDate),
      verificationPeriodMonths: parseInt(formData.verificationPeriodMonths),
    };

    setDevices((prev) => [...prev, newDevice]);
    setFormData({
      object: "",
      name: "",
      number: "",
      verificationDate: "",
      verificationPeriodMonths: "12",
    });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Shield" size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Учёт поверки приборов
              </h1>
              <p className="text-xs text-muted-foreground">
                Контроль сроков и статусов
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Icon name="Plus" size={16} />
                Добавить прибор
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Новый прибор</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="object">Объект</Label>
                  <Input
                    id="object"
                    placeholder="Цех №1, Лаборатория..."
                    value={formData.object}
                    onChange={(e) =>
                      setFormData({ ...formData, object: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deviceName">Прибор</Label>
                  <Input
                    id="deviceName"
                    placeholder="Манометр МП-3У"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deviceNumber">№ прибора</Label>
                  <Input
                    id="deviceNumber"
                    placeholder="МП-00142"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="vDate">Дата поверки</Label>
                    <Input
                      id="vDate"
                      type="date"
                      value={formData.verificationDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          verificationDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="vPeriod">Срок (мес.)</Label>
                    <Input
                      id="vPeriod"
                      type="number"
                      min="1"
                      value={formData.verificationPeriodMonths}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          verificationPeriodMonths: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full mt-2">
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="Gauge" size={20} className="text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Действует</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">
                    {stats.active}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Icon
                    name="CircleCheck"
                    size={20}
                    className="text-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Скоро</p>
                  <p className="text-2xl font-bold mt-1 text-amber-500">
                    {stats.expiringSoon}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Icon name="Clock" size={20} className="text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Просрочен</p>
                  <p className="text-2xl font-bold mt-1 text-red-500">
                    {stats.expired}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <Icon
                    name="AlertTriangle"
                    size={20}
                    className="text-red-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">
                  Каталог приборов
                </CardTitle>
                <div className="relative w-64">
                  <Icon
                    name="Search"
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Поиск..."
                    className="pl-9 h-9 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Объект
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Прибор
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        № прибора
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Дата поверки
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Срок до
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Остаток
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Статус
                      </TableHead>
                      <TableHead className="pr-6 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <Icon
                            name="Inbox"
                            size={40}
                            className="mx-auto mb-3 opacity-30"
                          />
                          <p>Приборы не найдены</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((device) => {
                        const daysLeft = getDaysLeft(device);
                        const expiry = getExpiryDate(device);
                        return (
                          <TableRow key={device.id} className="group">
                            <TableCell className="pl-6 font-medium">
                              {device.object}
                            </TableCell>
                            <TableCell>{device.name}</TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {device.number}
                            </TableCell>
                            <TableCell>
                              {format(device.verificationDate, "dd.MM.yyyy")}
                            </TableCell>
                            <TableCell>
                              {format(expiry, "dd.MM.yyyy")}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  daysLeft < 0
                                    ? "text-red-500 font-semibold"
                                    : daysLeft <= 30
                                      ? "text-amber-500 font-semibold"
                                      : "text-emerald-600 font-semibold"
                                }
                              >
                                {daysLeft < 0
                                  ? `${Math.abs(daysLeft)} дн. назад`
                                  : `${daysLeft} дн.`}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(daysLeft)}</TableCell>
                            <TableCell className="pr-6">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                                onClick={() => handleDelete(device.id)}
                              >
                                <Icon name="Trash2" size={15} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Icon name="CalendarDays" size={18} />
                  Календарь поверок
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  locale={ru}
                  modifiers={{
                    expired: calendarDates.expired,
                    expiring: calendarDates.expiring,
                    normal: calendarDates.normal,
                  }}
                  modifiersStyles={{
                    expired: {
                      backgroundColor: "hsl(0 84% 60%)",
                      color: "white",
                      borderRadius: "6px",
                    },
                    expiring: {
                      backgroundColor: "hsl(38 92% 50%)",
                      color: "white",
                      borderRadius: "6px",
                    },
                    normal: {
                      backgroundColor: "hsl(142 70% 45%)",
                      color: "white",
                      borderRadius: "6px",
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Icon name="Bell" size={18} />
                  Оповещения
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {devices
                  .filter((d) => getDaysLeft(d) <= 30)
                  .sort((a, b) => getDaysLeft(a) - getDaysLeft(b))
                  .map((device) => {
                    const dl = getDaysLeft(device);
                    return (
                      <div
                        key={device.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${dl < 0 ? "bg-red-50" : "bg-amber-50"}`}
                      >
                        <Icon
                          name={dl < 0 ? "AlertTriangle" : "Clock"}
                          size={16}
                          className={`mt-0.5 ${dl < 0 ? "text-red-500" : "text-amber-500"}`}
                        />
                        <div className="text-sm">
                          <p className="font-medium">{device.name}</p>
                          <p className="text-muted-foreground">
                            {device.object} · {device.number}
                          </p>
                          <p
                            className={`text-xs mt-1 font-medium ${dl < 0 ? "text-red-500" : "text-amber-600"}`}
                          >
                            {dl < 0
                              ? `Просрочен на ${Math.abs(dl)} дн.`
                              : `Осталось ${dl} дн.`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                {devices.filter((d) => getDaysLeft(d) <= 30).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Все приборы в порядке
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
