**TaskFlow** là ứng dụng quản lý dự án

##  Tính năng chính

-  **Kanban Board:** Kéo thả công việc (Drag & Drop) trực quan.
-  **Real-time Update:** Đồng bộ dữ liệu tức thì qua WebSocket (không cần tải lại trang).
-  **CRUD Issue:** Tạo, xem, sửa, xóa công việc dễ dàng.
-  **Statistics Dashboard:** Bảng thống kê tiến độ dự án.
-  **Responsive:** Giao diện tương thích tốt trên mọi thiết bị.

##  Tech Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Frontend:** React + Vite + Tailwind CSS
- **Real-time:** WebSocket

---

##  Hướng dẫn Cài đặt & Chạy

Bạn cần mở **2 cửa sổ Terminal** riêng biệt để chạy song song Backend và Frontend.

### Cách chạy

```bash
Backend
cd backend
pip install -r requirements.txt
python main.py
 Server API chạy tại: http://localhost:8000
 Tài liệu API (Swagger): http://localhost:8000/docs

Frontend 

cd frontend
npm install
npm run dev
 Web App chạy tại: http://localhost:5173

