type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function InputBox({ className = "", ...props }: Props) {
  return (
    <input
      {...props}
      className={`h-9 rounded bg-[#211C1C] border-[0.5px] border-[#707070]
        px-3 py-1 text-slate-100 placeholder:text-slate-200 placeholder:font-light text-sm
        focus:outline-none focus:ring-2 focus:ring-red-500
        focus:border-red-500 transition ${className}`}
    />
  );
}
