# Chi tiết các thành phần trên Màn hình Dashboard Sale (Vitimex)

Tài liệu này mô tả các thông tin và tính năng cần thiết cho một Dashboard dành riêng cho bộ phận Kinh doanh (Sale) thuộc ngành thời trang.

---

## 1. Quản lý Đơn hàng Đa nhiệm (Tabbed Orders)
Hệ thống phải hỗ trợ mở nhiều đơn hàng cùng lúc để Sale có thể xử lý linh hoạt:
*   **Cơ chế Tabs:** Cho phép thêm mới đơn hàng (Tab +) và chuyển đổi giữa các khách hàng (Khách 1, Khách 2...) mà không mất dữ liệu đang nhập.
*   **Trạng thái tạm lưu:** Tự động giữ nội dung đơn hàng khi chuyển tab.
*   **Phím tắt:** Sử dụng phím **F1** để nhanh chóng trỏ chuột vào ô tìm kiếm sản phẩm.

## 2. Tìm kiếm & Chọn hàng nhanh (Product Selection)
*   **Tìm kiếm thông minh:** Hỗ trợ tìm kiếm nhanh nhiều sản phẩm cùng lúc qua mã hoặc tên.
*   **Danh mục sản phẩm bán nhanh (Quick Access Grid):** 
    *   Hiển thị lưới sản phẩm ở phía dưới màn hình với hình ảnh minh họa vuông vắn.
    *   **Chọn Size trực tiếp:** Hiển thị các nút Size (38, 40, 42, 44, 46...) ngay trên card sản phẩm để chọn nhanh mà không cần mở tùy chỉnh.
    *   Thanh điều hướng phân trang (1/25) và chọn ngày giờ hiện tại thuận tiện.

## 3. Cấu trúc Bảng Hàng hóa (Product Table Columns)
Bảng hiển thị danh sách sản phẩm trong đơn hàng phải bao gồm các cột sau (theo mẫu hình ảnh):
1.  **Mã hàng:** Mã định danh sản phẩm.
2.  **Tên hàng / dịch vụ:** Tên chi tiết sản phẩm.
3.  **ĐVT:** Đơn vị tính (Chiếc, Bộ...).
4.  **Size:** Kích cỡ.
5.  **Màu sắc:** Màu sắc sản phẩm.
6.  **Số lượng:** Cho phép thay đổi trực tiếp trên dòng.
7.  **Đơn giá:** Giá bán niêm yết.
8.  **Số tiền:** (Số lượng x Đơn giá).
9.  **% Giảm/CK:** Tỷ lệ chiết khấu trên từng dòng.
10. **Giảm giá/CK:** Số tiền chiết khấu thực tế.
11. **Tổng tiền:** Giá trị sau cùng của dòng hàng đó.

## 4. Thanh toán & Sidebar Chi tiết (Payment & Billing)
Giao diện bên phải (Sidebar) cung cấp cái nhìn toàn diện về tài chính của đơn hàng:
*   **Thông tin khách hàng:** Ô tìm kiếm khách hàng bằng tên/SĐT, nút (+) để thêm khách mới nhanh.
*   **Chi tiết thu phí:**
    *   Trạng thái đơn (Dropdown: Hoàn thành, Chờ xử lý...).
    *   Tổng tiền hàng (Tiền trước chiết khấu).
    *   Điểm thưởng (Dành cho thành viên).
    *   Mã giảm giá (Nhập mã voucher).
    *   Chiết khấu (Giảm giá theo % hoặc số tiền).
    *   Phụ thu dịch vụ & VAT (Có nút + để thêm nhanh).
*   **Thanh toán:**
    *   **Tổng cộng:** Hiển thị màu Đỏ/Cam nổi bật.
    *   **Tiền khách trả:** Ô nhập số tiền khách đưa. 
    *   **Nút mệnh giá nhanh:** (1k, 2k, 5k, 10k, 20k, 50k, 100k, 200k, 500k) để nhập nhanh tiền khách đưa.
    *   **TÀI KHOẢN (+):** Cho phép chọn hình thức thanh toán (Tiền mặt, Chuyển khoản, Thẻ). Hỗ trợ tách tiền thanh toán nhiều kiểu (ví dụ trả mặt 1 nửa, bank 1 nửa).
    *   **Tiền thừa / Tiền nợ:** Hiển thị rõ số tiền cần trả lại hoặc số tiền khách còn thiếu.
*   **Nút hành động cuối:**
    *   Biểu tượng In (Màu vàng).
    *   Nút **THANH TOÁN** (Màu Đỏ cam, chiếm diện tích lớn nhất).

## 5. Các Chỉ số Tổng quan (KPI Cards)
Nằm ở khu vực báo cáo để quản lý nắm bắt hiệu quả kinh doanh nhanh.
*   Doanh số, Số đơn, Tỷ lệ chốt đơn, AOV, Tỷ lệ trả hàng.

---

## Gợi ý Công nghệ (Tech Stack)
*   **Frontend:** Vite + React/Next.js (để load nhanh và mượt).
*   **Styling:** Vanilla CSS hoặc Tailwind (ưu tiên thiết kế Premium Dark Mode).
*   **Biểu đồ:** Chart.js hoặc Recharts.
*   **Icons:** Lucide React hoặc FontAwesome.

## 6. Nhận diện Thương hiệu & Giao diện (Brand UI/UX)
Giao diện sẽ được thiết kế dựa trên phong cách Modern Minimalist của Website Vitimex:
*   **Bảng màu chủ đạo (Brand Palette):**
    *   **Primary Black (#000000):** Sử dụng cho Header, các nút hành động chính (Tiếp tục, Xem thêm).
    *   **Vitimex Red (#C42027):** Sử dụng cho các điểm nhấn quan trọng (Khuyến mãi, Nút Thanh toán, Cảnh báo).
    *   **Pure White (#FFFFFF):** Nền tảng chính để làm nổi bật sản phẩm.
    *   **Light Gray (#F5F5F5):** Nền phụ cho các khối chức năng.
*   **Typography:** Sử dụng Font Sans-serif hiện đại (như *Inter* hoặc *Outfit*), phân cấp rõ ràng giữa tiêu đề và nội dung.
*   **Hình ảnh:** Card sản phẩm phải có khung hình vuông sạch sẽ, hiển thị rõ giá và biến thể (size, màu).
> [!TIP]
> **Mẹo cho Sale:** Dashboard nên có tính năng **"Dự báo (Forecast)"** dựa trên dữ liệu quá khứ để gợi ý nhập mẫu gì cho mùa tiếp theo (ví dụ: mùa hè sắp tới thì đẩy mạnh Sơ mi lụa/cotton).
