"use server"

import { auth } from "@clerk/nextjs/server"
import prisma from "./client"
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const switchFollow = async (userId:string) => {
    const {userId : currentUserId} = auth();

    if (!currentUserId) {
        throw new Error("User not authenticated")
    }

    try {
       
        const existingFollow  = await prisma.follower.findFirst({
            where: {
                followerId: currentUserId,
                followingId: userId,
            }
        });

        if (existingFollow){
            await prisma.follower.delete({
                where:{
                    id: existingFollow.id,
                }
            })
        } else {
            const existingFollowRequest = await prisma.followRequest.findFirst({
                where: {
                    senderId: currentUserId,
                    receiverId: userId,
                }
            })
            if (existingFollowRequest){
                await prisma.followRequest.delete({
                    where:{
                        id: existingFollowRequest.id,

                    }
                })
            } else {
                await prisma.followRequest.create({
                    data: {
                        senderId: currentUserId,
                        receiverId: userId,
                    }
                })
            }
        }
    } catch(err) {
        console.error(err)
        throw new Error("Error switching follow status")
    }
}

export const switchBlock = async (userId:string) => {
    const { userId: currentUserId } = auth();

    if (!currentUserId) {
        throw new Error("User is not Authenticated!!");
      }

    try{
        const existingBlock = await prisma.block.findFirst({
            where:{
                blockerId: currentUserId,
                blockedId: userId,
            }
        });
        if (existingBlock) {
            await prisma.block.delete({
              where: {
                id: existingBlock.id,
              },
            });
        } else {
            await prisma.block.create({
              data: {
                blockerId: currentUserId,
                blockedId: userId,
              },
            });
        }

    } catch (err) {
        console.error(err)
        throw new Error("Error switching block status")        
    }

}

export const acceptFollowRequest = async (userId: string) => {
    const { userId: currentUserId } = auth();

    if (!currentUserId) {
        throw new Error("User is not Authenticated!!");
    }

    try {
        const existingFollowRequest = await prisma.followRequest.findFirst({
          where: {
            senderId: userId,
            receiverId: currentUserId,
          },
        });
    
        if (existingFollowRequest) {
          await prisma.followRequest.delete({
            where: {
              id: existingFollowRequest.id,
            },
          });
    
          await prisma.follower.create({
            data: {
              followerId: userId,
              followingId: currentUserId,
            },
          });
        }
      } catch (err) {
        console.log(err);
        throw new Error("Something went wrong!");
      }
   
};

export const declineFollowRequest = async (userId: string) => {
    const { userId: currentUserId } = auth();
  
    if (!currentUserId) {
      throw new Error("User is not Authenticated!!");
    }
  
    try {
      const existingFollowRequest = await prisma.followRequest.findFirst({
        where: {
          senderId: userId,
          receiverId: currentUserId,
        },
      });
  
      if (existingFollowRequest) {
        await prisma.followRequest.delete({
          where: {
            id: existingFollowRequest.id,
          },
        });
      }
    } catch (err) {
      console.log(err);
      throw new Error("Something went wrong!");
    }
};


export const updateProfile = async (prevState: { success: boolean; error: boolean },payload: { formData: FormData; cover: string })=>{

  const { formData, cover } = payload;         
  // Biến đổi formData thành object dạng {key: value}
  const fields = Object.fromEntries(formData);

  // Loại bỏ các field có giá trị rỗng ""
  const filteredFields = Object.fromEntries(
    Object.entries(fields).filter(([_, value]) => value !== "")
  );

  console.log(fields)

  // Định nghĩa schema kiểm tra dữ liệu đầu vào bằng zod
  const Profile = z.object({
    cover: z.string().optional(),
    name: z.string().max(60).optional(),
    surname: z.string().max(60).optional(),
    description: z.string().max(255).optional(),
    city: z.string().max(60).optional(),
    school: z.string().max(60).optional(),
    work: z.string().max(60).optional(),
    website: z.string().max(60).optional(),
  })

  // Gộp cover với các field nhập vào để xác thực
  const validatedFields = Profile.safeParse({cover,...filteredFields});

  // Nếu validate thất bại
  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return { success: false, error: true };
  }

  // Lấy userId từ phiên đăng nhập
  const { userId } = auth();

  // Nếu không có user (chưa đăng nhập)
  if(!userId) {
    return { success: false, error: true };
  }
  

  try {
    // Gọi prisma để cập nhật thông tin trong DB
    await prisma.user.update({
      where: {
        id:userId,
      },
      data: validatedFields.data,
    })
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }

}

// Hàm xử lý like/unlike cho bài viết
export const switchLike = async (postId: number) => {
  const { userId } = auth(); // Lấy userId từ người dùng hiện tại (đã đăng nhập)

  if (!userId) throw new Error("User is not authenticated!");

  try {
     // Kiểm tra xem user đã like bài viết này chưa
    const existingLike = await prisma.like.findFirst({
      where: {
        postId, // ID của bài viết
        userId, // ID của người dùng
      },
    });

    if (existingLike) {
      // Nếu đã like rồi → xóa like (unlike)
      await prisma.like.delete({
        where: {
          id: existingLike.id, // Xóa theo ID của bản ghi like
        },
      });
    } else {
      // Nếu chưa like → tạo bản ghi like mới
      await prisma.like.create({
        data: {
          postId, // Gán postId
          userId, // Gán userId
        },
      });
    }
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong");
  }
};

export const addComment = async (postId: number, desc: string) => {
  const { userId } = auth();

  if (!userId) throw new Error("User is not authenticated!");

  try {
    const createdComment = await prisma.comment.create({
      data: {
        desc,
        userId,
        postId,
      },
      include: {
        user: true,
      },
    });

    return createdComment;
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
}

export const addPost = async (formData: FormData, img: string) => {
  // Lấy dữ liệu mô tả (description) từ form
  const desc = formData.get("desc") as string;

  // Định nghĩa schema kiểm tra mô tả: phải là chuỗi, tối thiểu 1 ký tự, tối đa 255 ký tự
  const Desc = z.string().min(1).max(255);

  // Kiểm tra dữ liệu đầu vào theo schema
  const validatedDesc = Desc.safeParse(desc);

  // Nếu dữ liệu không hợp lệ, log lỗi và kết thúc hàm
  if (!validatedDesc.success) {
    //TODO
    console.log("description is not valid");
    return;
  }

  // Lấy thông tin người dùng hiện tại từ auth()
  const { userId } = auth();

  // Nếu không có userId (chưa đăng nhập), ném lỗi
  if (!userId) throw new Error("User is not authenticated!");

  try {
    // Tạo bài viết mới trong database thông qua Prisma
    await prisma.post.create({
      data: {
        desc: validatedDesc.data, // mô tả đã kiểm tra hợp lệ
        userId,                   // ID của người dùng đăng bài
        img,                      // đường dẫn hoặc URL hình ảnh đính kèm
      },
    });
    revalidatePath("/");
  } catch (err) {
    console.log(err);
  }

}

export const addStory = async (img: string) => {
  const { userId } = auth();

  if (!userId) throw new Error("User is not authenticated!");

  try {
    const existingStory = await prisma.story.findFirst({
      where: {
        userId,
      },
    });

    if (existingStory) {
      await prisma.story.delete({
        where: {
          id: existingStory.id,
        },
      });
    }
    const createdStory = await prisma.story.create({
      data: {
        userId,
        img,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        user: true,
      },
    });

    return createdStory;
  } catch (err) {
    console.log(err);
  }

}

export const deletePost = async (postId: number) => {
  const { userId } = auth();

  if (!userId) throw new Error("User is not authenticated!");

  try {
    await prisma.post.delete({
      where: {
        id: postId,
        userId,
      },
    });
    revalidatePath("/")
  } catch (err) {
    console.log(err);
  }
};