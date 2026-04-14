-- ══════════════════════════════════════════════════════════
-- SQL Order APIs cho Vitimex POS
-- Bao gồm: Lưu đơn hàng, chi tiết đơn hàng, thanh toán
-- ══════════════════════════════════════════════════════════

CREATE OR ALTER PROCEDURE API_POS_LuuDonHang
    @DuLieuDonHang NVARCHAR(MAX) 
AS
BEGIN
    SET NOCOUNT ON;
    -- Logic lưu vào InvoiceTbl và InvoiceDetailTbl
    -- @DuLieuDonHang là chuỗi JSON từ Frontend
    PRINT 'Logic luu don hang tai day'
END
GO

PRINT N'✅ Đã khởi tạo Order_Procs.sql';
GO
