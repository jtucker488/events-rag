import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const LoadMoreButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="w-[280px] h-[280px] flex flex-col justify-center items-center 
                 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow-md
                 transition-all duration-300 cursor-pointer"
    >
      <span className="text-lg font-semibold">
        Load Similar Events
        <ArrowForwardIosIcon className="mb-[10px] text-white mt-2" fontSize="large" />
      </span>
    </button>
  );
};

export default LoadMoreButton;
