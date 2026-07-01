describe('Pruebas en Productos Service', () => {
    test('Debería calcular un descuento correctamente', () => {
        const precioNormal = 10000;
        const precioOferta = 8000;
        const porcentajeDescuento = Math.round(((precioNormal - precioOferta) / precioNormal) * 100);
        
        expect(porcentajeDescuento).toBe(20); // deberia ser 20%
    });
});