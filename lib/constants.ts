// 11 room colors — each visually distinct, pastel palette
export const ROOM_COLORS: Record<number, { bg: string; text: string; border: string; dot: string }> = {
  1:  { bg: "bg-sky-100",      text: "text-sky-800",      border: "border-sky-300",      dot: "bg-sky-400" },
  2:  { bg: "bg-violet-100",   text: "text-violet-800",   border: "border-violet-300",   dot: "bg-violet-400" },
  3:  { bg: "bg-emerald-100",  text: "text-emerald-800",  border: "border-emerald-300",  dot: "bg-emerald-400" },
  4:  { bg: "bg-amber-100",    text: "text-amber-800",    border: "border-amber-300",    dot: "bg-amber-400" },
  5:  { bg: "bg-rose-100",     text: "text-rose-800",     border: "border-rose-300",     dot: "bg-rose-400" },
  6:  { bg: "bg-teal-100",     text: "text-teal-800",     border: "border-teal-300",     dot: "bg-teal-400" },
  7:  { bg: "bg-orange-100",   text: "text-orange-800",   border: "border-orange-300",   dot: "bg-orange-400" },
  8:  { bg: "bg-indigo-100",   text: "text-indigo-800",   border: "border-indigo-300",   dot: "bg-indigo-400" },
  9:  { bg: "bg-pink-100",     text: "text-pink-800",     border: "border-pink-300",     dot: "bg-pink-400" },
  10: { bg: "bg-cyan-100",     text: "text-cyan-800",     border: "border-cyan-300",     dot: "bg-cyan-400" },
  11: { bg: "bg-lime-100",     text: "text-lime-800",     border: "border-lime-300",     dot: "bg-lime-400" },
}

export const ROOM_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export const VACANCY_COLOR = {
  bg: "bg-green-50",
  text: "text-green-700",
  border: "border-green-300",
  dot: "bg-green-400",
}

export const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
export const DAYS_FULL_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
export const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
