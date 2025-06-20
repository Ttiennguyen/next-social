import prisma from "@/lib/client";
import { auth } from "@clerk/nextjs/server"
import Image from "next/image"
import Link from "next/link"
import FriendRequestList from "./FriendRequestList";

const FriendRequests = async () => {

  // Lấy thông tin user hiện tại sau khi xác thực
  const {userId} = auth();

  // Nếu chưa đăng nhập (không có userId) thì không render gì cả
  if (!userId) return null;

  // Truy vấn database để lấy danh sách các yêu cầu kết bạn gửi đến người dùng hiện tại
  const requests = await prisma.followRequest.findMany({
    where: {
      receiverId: userId,  // người nhận là user hiện tại
    },
    include: {
      sender: true, // kèm theo thông tin người gửi trong kết quả
    },
  })

  // Nếu không có yêu cầu kết bạn nào thì không render gì c
  if (requests.length === 0) return null;

  // Nếu có yêu cầu kết bạn, render giao diện thông báo
  return (
    <div className="p-4 bg-white rounded-lg shadow-md text-sm flex flex-col gap-4">
      {/* TOP */}
      <div className="flex justify-between items-center font-medium">
        <span className="text-gray-500">Friend Requests</span>
        <Link href="/" className="text-blue-500 text-xs">See all</Link>
      </div>
      {/* USER */}
      <FriendRequestList requests={requests}/>
       
    </div>
  )
}

export default FriendRequests
