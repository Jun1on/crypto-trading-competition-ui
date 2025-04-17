import Skeleton from "react-loading-skeleton";
const skeletonBaseColor = "#2d3748";
const skeletonHighlightColor = "#4a5568";

export default function CardLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 pb-0">
    <div className="flex justify-between items-baseline">
      <div>
        <Skeleton 
          width={150}
          height={28}
          baseColor={skeletonBaseColor} 
          highlightColor={skeletonHighlightColor} 
        />
      </div>
      <div>
        <Skeleton 
          width={100}
          height={32}
          baseColor={skeletonBaseColor} 
          highlightColor={skeletonHighlightColor} 
        />
      </div>
    </div>
    
    <div className="flex justify-between mt-2">
      <Skeleton 
        width={120}
        height={20}
        baseColor={skeletonBaseColor} 
        highlightColor={skeletonHighlightColor} 
      />
      <Skeleton 
        width={80}
        height={20}
        baseColor={skeletonBaseColor} 
        highlightColor={skeletonHighlightColor} 
      />
    </div>
  </div>
  
  {/* Chart skeleton */}
  <div className="p-4">
    <div className="h-80 flex items-center justify-center">
      <Skeleton 
        width="100%"
        height="100%"
        baseColor={skeletonBaseColor} 
        highlightColor={skeletonHighlightColor} 
      />
    </div>
  </div>
</div>
</div>
  );
}