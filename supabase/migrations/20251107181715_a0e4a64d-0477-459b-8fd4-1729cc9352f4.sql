-- Plan v1.16.1: Limpieza de historial duplicado
-- Eliminar entradas duplicadas del producto 055653111252
-- Solo mantener la más reciente (2025-11-07 18:05:31)

DELETE FROM scan_history
WHERE barcode = '055653111252'
  AND id IN (
    'f611d6ab-ea0a-4039-91c2-82c7ec45404b', -- 2025-11-07 17:43 (ai_photo sin nutri/nova)
    '173be524-0de8-41a3-987c-82bd0dc111a4'  -- 2025-11-07 17:39 (openfood_api)
  );

COMMENT ON TABLE scan_history IS 'Historial de escaneos con datos de análisis - limpiado de duplicados en v1.16.1';