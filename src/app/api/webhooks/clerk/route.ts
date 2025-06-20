import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(req: Request) {
  // Lấy secret từ biến môi trường để xác minh webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Lấy các header do Clerk gửi kèm để xác minh
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Nếu thiếu header thì trả lỗi
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Lấy nội dung webhook gửi tới
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Tạo một instance của Svix để xác minh webhook
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Xác minh tính hợp lệ của webhook dựa vào header và body
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Lấy thông tin loại sự kiện và user ID từ webhook
  const { id } = evt.data;
  const eventType = evt.type;
  // console.log(`Webhook with and ID of ${id} and type of ${eventType}`)
  // console.log('Webhook body:', body)

  // Nếu người dùng mới được tạo
  if (eventType === "user.created") {
    try {
      await prisma.user.create({
        data: {
          id: evt.data.id,
          username: JSON.parse(body).data.username, // tên người dùng
          avatar: JSON.parse(body).data.image_url || "/noAvatar.png", // ảnh đại diện mặc định nếu không có
          cover: "/noCover.png", // ảnh bìa mặc định
        },
      });
      return new Response("User has been created!", { status: 200 });
    } catch (err) {
      console.log(err);
      return new Response("Failed to create the user!", { status: 500 });
    }
  }

  // Nếu người dùng được cập nhật
  if (eventType === "user.updated") {
    try {
      await prisma.user.update({
        where: {
          id: evt.data.id,
        },
        data: {
          username: JSON.parse(body).data.username,
          avatar: JSON.parse(body).data.image_url || "/noAvatar.png",
        },
      });
      return new Response("User has been updated!", { status: 200 });
    } catch (err) {
      console.log(err);
      return new Response("Failed to update the user!", { status: 500 });
    }
  }

  // Nếu là sự kiện khác, không xử lý gì thêm
  return new Response("Webhook received", { status: 200 });
}