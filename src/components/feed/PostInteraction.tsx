"use client"

import { switchLike } from "@/lib/actions";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image"
import { useOptimistic, useState } from "react";

const PostInteraction = ({
    postId,
    likes,
    commentNumber,
  }: {
    postId: number;
    likes: string[];
    commentNumber: number;
  }) => {
    const { isLoaded, userId } = useAuth(); // Lấy thông tin người dùng từ Clerk

    // Trạng thái hiện tại của like: số lượng like và người dùng hiện tại đã like hay chưa
    const [likeState, setLikeState] = useState({
        likeCount: likes.length,
        isLiked: userId ? likes.includes(userId) : false,
    })

    const [optimisticLike, switchOptimisticLike] = useOptimistic(
        likeState,
        (state, value) => {
          return {
            likeCount: state.isLiked ? state.likeCount - 1 : state.likeCount + 1, // Tăng hoặc giảm số like
            isLiked: !state.isLiked , // Lật trạng thái đã like
          };
        }
    );

    // Hàm xử lý khi người dùng bấm like
    const likeAction = async () => {
        switchOptimisticLike("");
        try {
          switchLike(postId);// Gọi hàm xử lý server (không chờ kết quả)
          // Cập nhật trạng thái thật sau optimistic
          setLikeState((state) => ({
            likeCount: state.isLiked ? state.likeCount - 1 : state.likeCount + 1,
            isLiked: !state.isLiked,
          }));
        } catch (err) {}
    };



  return (
    <div className="flex items-center justify-between text-sm my-4">
            <div className="flex gap-8">
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl">
                    <form action={likeAction}>
                        <button>
                            <Image src={optimisticLike.isLiked ? "/liked.png" : "/like.png"} alt="" width={16} height={16} className="cursor-pointer"/>
                        </button>
                    </form>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">{optimisticLike.likeCount}<span className="hidden md:inline"> Likes</span></span>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl">
                    <Image src="/comment.png" alt="" width={16} height={16} className="cursor-pointer"/>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">{commentNumber}<span className="hidden md:inline"> Comments</span></span>
                </div>
            </div>
            <div className="">
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl">
                    <Image src="/share.png" alt="" width={16} height={16} className="cursor-pointer"/>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500"><span className="hidden md:inline"> Share</span></span>
                </div>
            </div>
        </div>
  )
}

export default PostInteraction
