import { LoaderCircle } from 'lucide-react';

const Loader = () => {
  return (
    <div className="flex justify-center">
      <LoaderCircle size={60} className="animate-spin text-blue-400" />
    </div>
  );
};

export default Loader;
