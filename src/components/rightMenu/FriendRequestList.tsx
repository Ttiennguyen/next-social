"use client"

import { acceptFollowRequest, declineFollowRequest } from "@/lib/actions";
import { FollowRequest, User } from "@prisma/client";
import Image from "next/image"
import { useOptimistic, useState } from "react";

// Định nghĩa kiểu dữ liệu: FollowRequest kết hợp với thông tin người gửi (sender)
type RequestWithUser = FollowRequest & {
    sender: User;
  };
const FriendRequestList = ({requests}:{requests:RequestWithUser[]}) => {
  // State gốc để lưu các yêu cầu ban đầu
    const [requestState, setRequestState] = useState(requests);

    // Hàm xử lý khi chấp nhận lời mời
    const accept = async (requestId: number, userId: string) => {
       // Gỡ bỏ trước khỏi UI (optimistic update)
        removeOptimisticRequest(requestId);
        try {
          await acceptFollowRequest(userId); // Gọi API thực tế
          setRequestState((prev) => prev.filter((req) => req.id !== requestId));
        } catch (err) {}
    };

    // Hàm xử lý khi từ chối lời mời
    const decline = async (requestId: number, userId: string) => {
        removeOptimisticRequest(requestId);
        try {
          await declineFollowRequest(userId);
          setRequestState((prev) => prev.filter((req) => req.id !== requestId));
        } catch (err) {}
      };

    // Sử dụng optimistic UI để cập nhật danh sách tạm thời
    const [optimisticRequests, removeOptimisticRequest] = useOptimistic(
        requestState,
        (state, value: number) => state.filter((req) => req.id !== value)
      );
  return (
    <div className="">
        {optimisticRequests.map(request=>(     
        <div className="flex items-center justify-between" key={request.id}>
                <div className="flex items-center gap-4">
                  <Image src={request.sender.avatar || "/noAvatar.png"} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover"/>
                  <span className="font-semibold">
                    {request.sender.name && request.sender.surname
                    ? request.sender.name + " " + request.sender.surname
                    : request.sender.username}
                  </span>
                </div>
                <div className="flex gap-3 justify-end">
                    <form action={() => accept(request.id, request.sender.id)}>
                        <button>
                            <Image src="/accept.png" alt="" width={20} height={20} className="cursor-pointer"/>
                        </button>
                    </form>
                    <form action={() => decline(request.id, request.sender.id)}>
                        <button>
                            <Image src="/reject.png" alt="" width={20} height={20} className="cursor-pointer"/>
                        </button>
                    </form>
                </div>
                
        </div>
    ))}
    </div>
  )
}

export default FriendRequestList
