-- ══════════════════════════════════════════════════════════
-- SQL Product APIs cho Vitimex POS
-- Bao gồm: Tìm kiếm hàng hóa, lấy giá và thuộc tính (Size, Màu)
-- ══════════════════════════════════════════════════════════

CREATE OR ALTER PROCEDURE API_POS_TimKiemHangHoa
    @ChiNhanhID NVARCHAR(50),
    @TuKhoaTimKiem NVARCHAR(100) = ''
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @s NVARCHAR(250) = N'%' + ISNULL(@TuKhoaTimKiem, '') + '%';

    WITH CurrentPrices AS (
        SELECT 
            PD.ItemID, 
            PD.UnitPrice, 
            PD.PhanTramGiamGia, 
            PD.UserAutoID,
            ROW_NUMBER() OVER (
                PARTITION BY PD.ItemID 
                ORDER BY P.IsAllBranch ASC, P.ToDate DESC, P.DocumentID DESC
            ) as PriceRank
        FROM AR_PriceTbl P
        INNER JOIN AR_PriceDetailTbl PD ON P.DocumentID = PD.DocumentID
        WHERE COALESCE(P.isDisable, 0) = 0
          AND P.FromDate <= GETDATE() 
          AND P.ToDate >= GETDATE()
          AND (
            P.IsAllBranch = 1 
            OR EXISTS (SELECT 1 FROM AR_PriceDetail2Tbl PD2 WHERE PD2.DocumentID = P.DocumentID AND PD2.BranchID = @ChiNhanhID)
          )
    )
    SELECT TOP 30
        A.CategoryID, 
        A.CategoryName, 
        A.ItemID, 
        A.ItemName, 
        A.Unit, 
        A.IsService,  
        UnitPrice = COALESCE(NULLIF(CAST(P.UnitPrice AS FLOAT), 0), 0),
        PhanTramGiamGia = COALESCE(NULLIF(CAST(P.PhanTramGiamGia AS FLOAT), 0), 0),
        Size = ISNULL(A.Size, ''), 
        MauSac = ISNULL(A.MauSac, ''),
        IsHot = 1
    FROM vItem A
    LEFT JOIN CurrentPrices P ON A.ItemID = P.ItemID AND P.PriceRank = 1
    WHERE (A.ItemID LIKE @s OR A.ItemName LIKE @s)
    ORDER BY (CASE WHEN A.ItemID = @TuKhoaTimKiem THEN 0 ELSE 1 END), A.ItemID
END
GO

PRINT N'✅ Đã khởi tạo Product_Procs.sql';
GO
