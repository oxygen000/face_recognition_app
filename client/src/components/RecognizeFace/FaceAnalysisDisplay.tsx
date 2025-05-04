import React, { useMemo } from "react";
import { RecognizeResponse } from "../../types";
import { useNavigate } from "react-router-dom";

// استيراد دالة getUserImageUrl من الملف المناسب
import { getUserImageUrl } from "../users/utils/formatters"; // تأكد من تعديل المسار حسب المكان الذي خزنت فيه الدالة

interface FaceAnalysisDisplayProps {
  result: RecognizeResponse;
  apiUrl?: string; // إضافة خاصية apiUrl إذا كنت ترغب في تخصيص قاعدة URL
}

const FaceAnalysisDisplay: React.FC<FaceAnalysisDisplayProps> = React.memo(({ result, apiUrl }) => {
  const navigate = useNavigate();

  // التحقق مما إذا كان هناك تعرّف أو مستخدم
  const shouldDisplay = useMemo(() => result.recognized && result.user, [result]);

  if (!shouldDisplay) return null;  // عدم العرض إذا لم يكن هناك تعرّف

  const handleUserClick = () => {
    if (result.user) {
      navigate(`/users/${result.user.id}`);
    }
  };

  const { user } = result;

  // استخدام دالة getUserImageUrl للحصول على رابط الصورة
  const imageUrl = user ? getUserImageUrl(user, apiUrl) : undefined;

  return (
    <div
      className="mt-4 bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:bg-gray-50 transition"
      onClick={handleUserClick}
    >
      <div className="flex items-center p-4 gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={user?.name || "Unknown User"}
            className="h-14 w-14 rounded-full object-cover border-2 border-green-500"
          />
        ) : (
          <div className="h-14 w-14 bg-gray-200 rounded-full flex items-center justify-center">
            {/* مكان الصورة في حال لم تكن موجودة */}
            <span className="text-gray-500 text-xl">?</span>
          </div>
        )}
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {user?.employee_id} - {user?.name}
          </h3>
        </div>
      </div>
    </div>
  );
});

export default FaceAnalysisDisplay;
