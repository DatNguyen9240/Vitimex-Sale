-- ══════════════════════════════════════════════════════════
-- SQL APIs cho Vitimex POS Dashboard (Tên Tiếng Việt)
-- Dựa trên cấu hình metadata từ hình ảnh
-- ══════════════════════════════════════════════════════════

-- 1. API Lấy danh sách Khách hàng (ObjectID)
-- Trả về: ObjectID, ObjectName, NgaySinh
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachKhachHang
AS
BEGIN
    SELECT DISTINCT ObjectID, ObjectName, NgaySinh 
    FROM InvoiceTbl 
    WHERE DocumentDate > DATEADD(Day, -730, GETDATE()) 
      AND COALESCE(ObjectID, '') <> ''
    ORDER BY ObjectName
END
GO

-- 2. API Lấy danh sách Người dùng/Sale (UserCreate)
-- Trả về: UserName, HoTen
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachNguoiDung
AS
BEGIN
    SELECT UserName, HoTen, BranchID
    FROM SY_User
END
GO

-- 3. API Lấy danh sách Chi nhánh (BranchID)
-- Trả về: BranchID, BranchName
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachChiNhanh
    @UserName NVARCHAR(50) = ''
AS
BEGIN
    SELECT BranchID, BranchName 
    FROM SY_GetBranchFullFnc(@UserName)
END
GO

-- 4. API Lấy danh sách Nhân viên (EmployeeID)
-- Trả về: EmployeeID, EmployeeName
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachNhanVien
AS
BEGIN
    SELECT EmployeeID, EmployeeName 
    FROM CF_EmployeeTbl 
    ORDER BY EmployeeName
END
GO

-- 5. API Tìm kiếm Hàng hóa (ItemID)
-- Tham số: @ChiNhanhID, @TuKhoaTimKiem
-- Trả về: ItemID, ItemName, Unit, UnitPrice, PhanTramGiamGia, Size, MauSac
CREATE OR ALTER PROCEDURE API_POS_TimKiemHangHoa
    @ChiNhanhID NVARCHAR(50),
    @TuKhoaTimKiem NVARCHAR(100) = ''
AS
BEGIN
    -- Gọi lại Store gốc theo logic trong metadata
    EXEC InvoiceGetItemListStp @ChiNhanhID, @TuKhoaTimKiem
END
GO

-- 6. API Lưu Đơn hàng (Thanh toán)
CREATE OR ALTER PROCEDURE API_POS_LuuDonHang
    @DuLieuDonHang NVARCHAR(MAX) 
AS
BEGIN
    -- Logic lưu vào InvoiceTbl và InvoiceDetailTbl
    PRINT 'Logic luu don hang tai day'
END
GO

-- 7. API Lấy danh sách Phương thức thanh toán
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachPhuongThucThanhToan
AS
BEGIN
    -- Trả về: ID, Name (VD: TIENMAT, CHUYENKHOAN...)
    -- Chỗ này có thể lấy từ bảng cấu hình thanh toán của bạn
    SELECT 'TIENMAT' AS ID, N'Tiền mặt' AS Name
    UNION ALL SELECT 'CHUYENKHOAN', N'Chuyển khoản'
    UNION ALL SELECT 'THE', N'Quản quẹt thẻ'
    UNION ALL SELECT 'VNPAY', N'VNPay'
END
GO

-- 8. API Lấy danh sách Trạng thái đơn hàng
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachTrangThaiDonHang
AS
BEGIN
    SELECT 'HOAN_THANH' AS ID, N'Hoàn thành' AS Name
    UNION ALL SELECT 'CHO_XU_LY', N'Chờ xử lý'
    UNION ALL SELECT 'DANG_GIAO', N'Đang giao'
    UNION ALL SELECT 'HUY', N'Đã hủy'
END

GO

PRINT N'✅ Đã khởi tạo các Stored Procedures POS với tên Tiếng Việt';
GO
