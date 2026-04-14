-- ══════════════════════════════════════════════════════════
-- SQL Master Data APIs cho Vitimex POS
-- Bao gồm: Chi nhánh, Nhân viên, Thanh toán, Trạng thái
-- ══════════════════════════════════════════════════════════

-- 1. API Lấy danh sách Chi nhánh (BranchID)
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachChiNhanh
    @UserName NVARCHAR(50) = ''
AS
BEGIN
    SELECT BranchID, BranchName 
    FROM SY_GetBranchFullFnc(@UserName)
END
GO

-- 3. API Lấy danh sách Nhân viên (EmployeeID)
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachNhanVien
AS
BEGIN
    SELECT EmployeeID, EmployeeName 
    FROM CF_EmployeeTbl 
    ORDER BY EmployeeName
END
GO

-- 4. API Lấy danh sách Phương thức thanh toán
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachPhuongThucThanhToan
AS
BEGIN
    SELECT 
        PaymentType     AS ID,
        PaymentTypeName AS Name
    FROM EI_PaymentTypeTbl
    ORDER BY ISNULL(STT, 999), PaymentTypeName
END
GO


-- 5. API Lấy danh sách Trạng thái đơn hàng
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachTrangThaiDonHang
AS
BEGIN
    SELECT 'HOAN_THANH' AS ID, N'Hoàn thành' AS Name
    UNION ALL SELECT 'CHO_XU_LY', N'Chờ xử lý'
    UNION ALL SELECT 'DANG_GIAO', N'Đang giao'
    UNION ALL SELECT 'HUY', N'Đã hủy'
END
GO

-- 5. API Lấy danh sách Nhóm khách hàng
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachNhomKhachHang
AS
BEGIN
    SELECT ObjectGroupID, ObjectGroupName
    FROM CF_ObjectGroupTbl
    ORDER BY ObjectGroupName
END
GO

-- 6. API Lấy danh sách Tỉnh thành
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachTinhThanh
AS
BEGIN
    -- Đã bỏ điều kiện lọc IsProvince vì bị lỗi cột không tồn tại
    -- Hiện tại lấy tất cả địa điểm để tránh bị rỗng giao diện
    SELECT LocationID, LocationName 
    FROM CF_LocationTbl 
    ORDER BY LocationName
END
GO

-- 7. API Lấy danh sách Ngân hàng
CREATE OR ALTER PROCEDURE API_POS_LayDanhSachNganHang
AS
BEGIN
    -- Lấy BankID (ví dụ: AGRI CTY) ghép với AccountNo để hiển thị rõ tên
    SELECT 
        BankID AS ID, 
        BankID + ' (' + AccountNo + ')' AS Name
    FROM CF_BankTbl
    ORDER BY BankID
END
GO


PRINT N'✅ Đã cập nhật MasterData_Procs.sql với Danh mục động';
GO
