"use client"

import { addComment } from "@/lib/actions";
import { useUser } from "@clerk/nextjs";
import { Comment, User } from "@prisma/client";
import Image from "next/image"
import { useOptimistic, useState } from "react";

// Định nghĩa kiểu dữ liệu comment có kèm thông tin user
type CommentWithUser = Comment & { user: User };

const CommentList = ({
    comments, // Danh sách comment hiện có
    postId,   // ID bài viết
  }: {
    comments: CommentWithUser[];
    postId: number;
  }) => {

  const { user } = useUser(); // Lấy thông tin user từ Clerk
  const [commentState, setCommentState] = useState(comments); // Trạng thái danh sách comment
  const [desc, setDesc] = useState(""); // Nội dung comment người dùng nhập

   // Hàm xử lý gửi comment mới
  const add = async () => {
    if (!user || !desc) return; // Nếu chưa đăng nhập hoặc chưa nhập gì thì không gửi

    // Gửi comment tạm thời lên UI bằng optimistic update
    addOptimisticComment({
      id: Math.random(),
      desc,
      createdAt: new Date(Date.now()),
      updatedAt: new Date(Date.now()),
      userId: user.id,
      postId: postId,
      user: {
        id: user.id,
        username: "Sending Please Wait...",
        avatar: user.imageUrl || "/noAvatar.png",
        cover: "",
        description: "",
        name: "",
        surname: "",
        city: "",
        work: "",
        school: "",
        website: "",
        createdAt: new Date(Date.now()),
      },
    });
    try {
      // Gọi API thực tế để thêm comment vào DB
      const createdComment = await addComment(postId, desc);
      // Cập nhật lại state với comment thật từ server
      setCommentState((prev) => [createdComment, ...prev]);
    } catch (err) {}
  };

  // useOptimistic để cập nhật giao diện tức thì mà không cần chờ server phản hồi
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    commentState,
    (state, value: CommentWithUser) => [value, ...state]
  );

  return (
    <>
        {user && (<div className="flex items-center gap-4">
                <Image src={user.imageUrl || "/noAvatar.png"} alt="" width={32} height={32} className="w-8 h-8 rounded-full"/>
                <form action={add} className="flex-1 flex items-center justify-between bg-slate-100 rounded-xl text-sm px-6 py-2 w-full">
                    <input type="text" placeholder="Write a comment..." className="bg-transparent outline-none flex-1" onChange={(e) => setDesc(e.target.value)}/>
                    <Image src="/emoji.png" alt="" width={16} height={16} className="cursor-pointer"/>
                </form>
        </div>)}
            {/* COMMENTS */}
            <div className="">
                {/* COMMENTS */}
                {optimisticComments.map(comment=>(
            
                <div className="flex gap-4 justify-between mt-6" key={comment.id}>
                    {/* AVATAR */}
                    <Image src={comment.user.avatar || "/noAvatar.png"} alt="" width={40} height={40} className="w-10 h-10 rounded-full"/>
                    {/* DESC */}
                    <div className="flex flex-col gap-2 flex-1">
                        <span className="font-medium">{comment.user.name && comment.user.surname ? comment.user.name+" "+ comment.user.surname: comment.user.username}</span>
                        <p>{comment.desc}</p>
                        <div className="flex items-center gap-8 text-xs text-gray-500 mt-2">
                            <div className="flex items-center gap-4">
                            <Image src="/like.png" alt="" width={12} height={12} className="cursor-pointer w-4 h-4"/>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-500">0 Likes</span>
                            </div>
                            <div className="">Reply</div>
                        </div>
                    </div>
                    {/* ICON */}
                    <Image src="/more.png" alt="" width={16} height={16} className="cursor-pointer w-4 h-4"/>
                
                </div>
                ))
                }
            </div>
    </>
  )
}

export default CommentList

