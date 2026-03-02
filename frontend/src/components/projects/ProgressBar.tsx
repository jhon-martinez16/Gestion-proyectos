interface Props {
  total: number;
  completados: number;
}

export default function ProgressBar({ total, completados }: Props) {
  const porcentaje = total === 0 ? 0 : (completados / total) * 100;

  return (
    <div className="w-full">
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-3 bg-blue-500 transition-all duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {completados} de {total} completados ({Math.round(porcentaje)}%)
      </p>
    </div>
  );
}