interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="bg-red-50 text-red-600 p-3 rounded-sm text-sm mt-3">
      {message}
    </div>
  );
}
