-- ══════════════════════════════════════════════════════════
-- API Khách hàng cho Vitimex POS
-- Bao gồm: Lấy danh sách, Thêm mới
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

-- 2. API Thêm mới Khách hàng
-- Tự động phân bổ dữ liệu vào CF_ObjectTbl và HR_PersonTbl
CREATE OR ALTER PROCEDURE API_POS_ThemMoiKhachHang
    @ObjectName NVARCHAR(200),          -- Tên khách hàng
    @Phone NVARCHAR(50),               -- Số điện thoại
    @Address NVARCHAR(500) = '',        -- Địa chỉ
    @ObjectGroupID NVARCHAR(50) = 'KH_LE', -- Nhóm khách hàng
    @LocationID NVARCHAR(50) = '',      -- Tỉnh thành (ID)
    @ProvinceName NVARCHAR(100) = '',   -- Tỉnh thành (Tên)
    @EmployeeID NVARCHAR(50) = '',      -- Nhân viên quản lý
    @TaxCode NVARCHAR(50) = '',         -- MST hoặc CCCD
    @DinhMucNo FLOAT = 0,               -- Dư nợ / Hạn mức nợ
    @BirthDay DATETIME = NULL,          -- Ngày sinh
    @Gender NVARCHAR(20) = '',          -- Giới tính
    @Email NVARCHAR(100) = '',          -- Email
    @Company NVARCHAR(200) = '',        -- Công ty
    @Notes NVARCHAR(MAX) = '',          -- Ghi chú
    @UserName NVARCHAR(50)              -- Tên người dùng tạo
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NewID NVARCHAR(50);
    
    -- 1. Phát sinh mã khách hàng tự động
    -- Logic: KH + YYMM (năm tháng) + 4 số thứ tự ngẫu nhiên (nếu không có hàm SY_GetNewID)
    SET @NewID = 'KH' + REPLACE(CONVERT(NVARCHAR(5), GETDATE(), 12), '-', '') + 
                 RIGHT('0000' + CAST(CAST(RAND() * 10000 AS INT) AS NVARCHAR(4)), 4);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 2. Ghi vào bảng danh mục Đối tượng (Dùng cho Bán hàng)
        INSERT INTO CF_ObjectTbl (
            ObjectID, 
            ObjectName, 
            Phone, 
            Address, 
            TaxCode, 
            ObjectGroupID, 
            LocationID, 
            EmployeeID, 
            Notes, 
            DinhMucNo, 
            UserCreate, 
            DateCreate,
            isDefault
        )
        VALUES (
            @NewID, 
            @ObjectName, 
            @Phone, 
            @Address, 
            @TaxCode,
            @ObjectGroupID, 
            @LocationID, 
            @EmployeeID, 
            @Notes,
            @DinhMucNo, 
            @UserName, 
            GETDATE(),
            0
        );

        -- 3. Ghi vào bảng Hồ sơ cá nhân (Dùng cho thông tin nhân thân)
        INSERT INTO HR_PersonTbl (
            PersonID, 
            PersonName, 
            CMND, 
            NgaySinh, 
            GioiTinh, 
            Email, 
            DienThoai, 
            DiaChiThuongTru, 
            ProvineName,
            HospitalName, 
            UserCreate, 
            DateCreate,
            PersonStatus
        )
        VALUES (
            @NewID, 
            @ObjectName, 
            @TaxCode, 
            @BirthDay, 
            @Gender,
            @Email, 
            @Phone, 
            @Address, 
            @ProvinceName,
            @Company, 
            @UserName, 
            GETDATE(),
            1
        );

        -- 4. Ghi vào bảng bổ trợ HV_CustomerTbl (Nếu DB có bảng này)
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'HV_CustomerTbl')
        BEGIN
            INSERT INTO HV_CustomerTbl (
                CustomerID, 
                CustomerName, 
                Phone, 
                Address, 
                BirthDay, 
                Gender, 
                Email, 
                Company,
                Province
            )
            VALUES (
                @NewID, 
                @ObjectName, 
                @Phone, 
                @Address, 
                @BirthDay, 
                @Gender, 
                @Email, 
                @Company,
                @ProvinceName
            );
        END

        COMMIT TRANSACTION;
        
        -- 5. Trả về kết quả cho Frontend
        SELECT 
            @NewID AS ObjectID, 
            @ObjectName AS ObjectName, 
            'SUCCESS' AS Status,
            N'Thêm mới khách hàng thành công' AS Message;

    END TRY
    BEGIN CATCH
        -- Rollback nếu có bất kỳ lỗi nào xảy ra
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrState INT = ERROR_STATE();
        DECLARE @ErrSeverity INT = ERROR_SEVERITY();

        RAISERROR(@ErrMsg, @ErrSeverity, @ErrState);
    END CATCH
END
GO
