import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const forecastRequestSchema = z.object({
  product_id: z.string().optional(),
  category: z.string().optional(),
  days_ahead: z.number().min(1).max(365).default(30),
  include_seasonality: z.boolean().default(true),
  confidence_level: z.number().min(0.5).max(0.99).default(0.95)
});

const salesDataSchema = z.object({
  product_id: z.string(),
  date: z.string().datetime(),
  quantity_sold: z.number().min(0),
  revenue: z.number().min(0),
  category: z.string().optional()
});

const bulkSalesDataSchema = z.array(salesDataSchema);

// Interfaces
interface SalesDataPoint {
  product_id: string;
  date: string;
  quantity_sold: number;
  revenue: number;
  category?: string;
}

interface ForecastResult {
  product_id: string;
  product_name: string;
  category: string;
  current_stock: number;
  predicted_demand: number;
  reorder_point: number;
  suggested_order_quantity: number;
  forecast_accuracy: number;
  risk_level: 'low' | 'medium' | 'high';
  seasonal_factors: {
    month: number;
    factor: number;
  }[];
  trend_analysis: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
  };
}

interface InventoryAlert {
  product_id: string;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  days_until_stockout: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  suggested_action: string;
}

// Mock sales data (in production, fetch from database)
const mockSalesData: SalesDataPoint[] = [
  // Sample data for demonstration
  { product_id: '1', date: '2024-01-01T00:00:00Z', quantity_sold: 5, revenue: 25000, category: 'Air Conditioners' },
  { product_id: '1', date: '2024-01-02T00:00:00Z', quantity_sold: 3, revenue: 15000, category: 'Air Conditioners' },
  { product_id: '2', date: '2024-01-01T00:00:00Z', quantity_sold: 8, revenue: 12000, category: 'Fans' },
  { product_id: '2', date: '2024-01-02T00:00:00Z', quantity_sold: 12, revenue: 18000, category: 'Fans' },
  // Add more mock data as needed
];

// Mock product inventory (in production, fetch from database)
const mockInventory = new Map([
  ['1', { name: 'Split AC 1.5 Ton', current_stock: 25, category: 'Air Conditioners' }],
  ['2', { name: 'Ceiling Fan 52"', current_stock: 150, category: 'Fans' }],
  ['3', { name: 'Window AC 1 Ton', current_stock: 8, category: 'Air Conditioners' }],
  ['4', { name: 'Tower Fan', current_stock: 45, category: 'Fans' }],
  ['5', { name: 'Cassette AC 2 Ton', current_stock: 12, category: 'Air Conditioners' }]
]);

// Simple moving average calculation
function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  return result;
}

// Calculate trend using linear regression
function calculateTrend(data: number[]): { slope: number; direction: 'increasing' | 'decreasing' | 'stable'; strength: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, direction: 'stable', strength: 0 };
  
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const strength = Math.abs(slope) / (sumY / n); // Normalized strength
  
  let direction: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(slope) < 0.1) {
    direction = 'stable';
  } else if (slope > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }
  
  return { slope, direction, strength: Math.min(strength, 1) };
}

// Calculate seasonal factors by month
function calculateSeasonalFactors(salesData: SalesDataPoint[]): { month: number; factor: number }[] {
  const monthlyData = new Map<number, number[]>();
  
  // Group sales by month
  salesData.forEach(sale => {
    const month = new Date(sale.date).getMonth() + 1;
    if (!monthlyData.has(month)) {
      monthlyData.set(month, []);
    }
    monthlyData.get(month)!.push(sale.quantity_sold);
  });
  
  // Calculate average for each month
  const monthlyAverages = new Map<number, number>();
  let overallAverage = 0;
  let totalSales = 0;
  
  monthlyData.forEach((sales, month) => {
    const avg = sales.reduce((a, b) => a + b, 0) / sales.length;
    monthlyAverages.set(month, avg);
    totalSales += sales.reduce((a, b) => a + b, 0);
  });
  
  overallAverage = totalSales / salesData.length;
  
  // Calculate seasonal factors
  const factors: { month: number; factor: number }[] = [];
  for (let month = 1; month <= 12; month++) {
    const monthAvg = monthlyAverages.get(month) || overallAverage;
    const factor = overallAverage > 0 ? monthAvg / overallAverage : 1;
    factors.push({ month, factor });
  }
  
  return factors;
}

// Simple demand forecasting using exponential smoothing
function forecastDemand(
  historicalData: number[],
  daysAhead: number,
  alpha: number = 0.3
): { prediction: number; accuracy: number } {
  if (historicalData.length === 0) {
    return { prediction: 0, accuracy: 0 };
  }
  
  // Exponential smoothing
  let forecast = historicalData[0];
  const errors: number[] = [];
  
  for (let i = 1; i < historicalData.length; i++) {
    const error = Math.abs(forecast - historicalData[i]);
    errors.push(error);
    forecast = alpha * historicalData[i] + (1 - alpha) * forecast;
  }
  
  // Calculate accuracy (1 - MAPE)
  const mape = errors.length > 0 
    ? errors.reduce((sum, error, i) => sum + error / Math.max(historicalData[i + 1], 1), 0) / errors.length
    : 0;
  const accuracy = Math.max(0, 1 - mape);
  
  // Project forecast for future days
  const dailyForecast = forecast / 30; // Convert to daily
  const totalPrediction = dailyForecast * daysAhead;
  
  return { prediction: Math.round(totalPrediction), accuracy };
}

// Calculate reorder point and suggested order quantity
function calculateReorderMetrics(
  predictedDemand: number,
  currentStock: number,
  leadTimeDays: number = 7,
  safetyStockDays: number = 14
): { reorderPoint: number; suggestedOrderQuantity: number; riskLevel: 'low' | 'medium' | 'high' } {
  const dailyDemand = predictedDemand / 30;
  const leadTimeDemand = dailyDemand * leadTimeDays;
  const safetyStock = dailyDemand * safetyStockDays;
  const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);
  
  // Economic Order Quantity (simplified)
  const monthlyDemand = predictedDemand;
  const suggestedOrderQuantity = Math.ceil(monthlyDemand * 1.5); // 1.5 months supply
  
  // Risk assessment
  let riskLevel: 'low' | 'medium' | 'high';
  if (currentStock > reorderPoint * 1.5) {
    riskLevel = 'low';
  } else if (currentStock > reorderPoint) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  return { reorderPoint, suggestedOrderQuantity, riskLevel };
}

// Generate inventory alerts
function generateInventoryAlerts(forecasts: ForecastResult[]): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];
  
  forecasts.forEach(forecast => {
    if (forecast.current_stock <= forecast.reorder_point) {
      const dailyDemand = forecast.predicted_demand / 30;
      const daysUntilStockout = dailyDemand > 0 
        ? Math.floor(forecast.current_stock / dailyDemand)
        : 999;
      
      let priority: 'urgent' | 'high' | 'medium' | 'low';
      let suggestedAction: string;
      
      if (daysUntilStockout <= 3) {
        priority = 'urgent';
        suggestedAction = 'IMMEDIATE REORDER REQUIRED - Stock will run out in 3 days or less';
      } else if (daysUntilStockout <= 7) {
        priority = 'high';
        suggestedAction = 'Reorder immediately - Stock will run out within a week';
      } else if (daysUntilStockout <= 14) {
        priority = 'medium';
        suggestedAction = 'Schedule reorder - Stock will run out within 2 weeks';
      } else {
        priority = 'low';
        suggestedAction = 'Monitor closely - Below reorder point but sufficient for now';
      }
      
      alerts.push({
        product_id: forecast.product_id,
        product_name: forecast.product_name,
        current_stock: forecast.current_stock,
        reorder_point: forecast.reorder_point,
        days_until_stockout: daysUntilStockout,
        priority,
        suggested_action: suggestedAction
      });
    }
  });
  
  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return alerts;
}

// Export sales data to CSV format
function exportSalesDataToCSV(salesData: SalesDataPoint[]): string {
  const headers = ['Product ID', 'Date', 'Quantity Sold', 'Revenue', 'Category'];
  const rows = salesData.map(sale => [
    sale.product_id,
    sale.date,
    sale.quantity_sold.toString(),
    sale.revenue.toString(),
    sale.category || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  return csvContent;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      product_id: searchParams.get('product_id') || undefined,
      category: searchParams.get('category') || undefined,
      days_ahead: parseInt(searchParams.get('days_ahead') || '30'),
      include_seasonality: searchParams.get('include_seasonality') !== 'false',
      confidence_level: parseFloat(searchParams.get('confidence_level') || '0.95')
    };
    
    const validatedParams = forecastRequestSchema.parse(params);
    
    // Filter sales data based on request
    let filteredSalesData = mockSalesData;
    if (validatedParams.product_id) {
      filteredSalesData = filteredSalesData.filter(sale => sale.product_id === validatedParams.product_id);
    }
    if (validatedParams.category) {
      filteredSalesData = filteredSalesData.filter(sale => sale.category === validatedParams.category);
    }
    
    // Group sales data by product
    const productSalesMap = new Map<string, SalesDataPoint[]>();
    filteredSalesData.forEach(sale => {
      if (!productSalesMap.has(sale.product_id)) {
        productSalesMap.set(sale.product_id, []);
      }
      productSalesMap.get(sale.product_id)!.push(sale);
    });
    
    // Generate forecasts for each product
    const forecasts: ForecastResult[] = [];
    
    productSalesMap.forEach((sales, productId) => {
      const inventory = mockInventory.get(productId);
      if (!inventory) return;
      
      // Extract quantity data for forecasting
      const quantities = sales.map(sale => sale.quantity_sold);
      
      // Calculate forecast
      const { prediction, accuracy } = forecastDemand(quantities, validatedParams.days_ahead);
      
      // Calculate seasonal factors if requested
      const seasonalFactors = validatedParams.include_seasonality 
        ? calculateSeasonalFactors(sales)
        : [];
      
      // Calculate trend
      const trendAnalysis = calculateTrend(quantities);
      
      // Calculate reorder metrics
      const { reorderPoint, suggestedOrderQuantity, riskLevel } = calculateReorderMetrics(
        prediction,
        inventory.current_stock
      );
      
      forecasts.push({
        product_id: productId,
        product_name: inventory.name,
        category: inventory.category,
        current_stock: inventory.current_stock,
        predicted_demand: prediction,
        reorder_point: reorderPoint,
        suggested_order_quantity: suggestedOrderQuantity,
        forecast_accuracy: accuracy,
        risk_level: riskLevel,
        seasonal_factors: seasonalFactors,
        trend_analysis: trendAnalysis
      });
    });
    
    // Generate inventory alerts
    const alerts = generateInventoryAlerts(forecasts);
    
    return NextResponse.json({
      success: true,
      data: {
        forecasts,
        alerts,
        summary: {
          total_products: forecasts.length,
          high_risk_products: forecasts.filter(f => f.risk_level === 'high').length,
          urgent_alerts: alerts.filter(a => a.priority === 'urgent').length,
          forecast_period_days: validatedParams.days_ahead,
          generated_at: new Date().toISOString()
        }
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    console.error('Inventory forecast API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// POST endpoint to upload sales data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const salesData = bulkSalesDataSchema.parse(body);
    
    // In production, save to database
    console.log('Received sales data:', salesData.length, 'records');
    
    // Process and validate the data
    const processedData = salesData.map(sale => ({
      ...sale,
      date: new Date(sale.date).toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      message: 'Sales data uploaded successfully',
      data: {
        records_processed: processedData.length,
        date_range: {
          from: Math.min(...processedData.map(d => new Date(d.date).getTime())),
          to: Math.max(...processedData.map(d => new Date(d.date).getTime()))
        }
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid sales data format',
          details: error.errors
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    console.error('Sales data upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// Export sales data as CSV
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const category = searchParams.get('category');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // Filter data based on parameters
    let filteredData = mockSalesData;
    
    if (category) {
      filteredData = filteredData.filter(sale => sale.category === category);
    }
    
    if (startDate) {
      filteredData = filteredData.filter(sale => new Date(sale.date) >= new Date(startDate));
    }
    
    if (endDate) {
      filteredData = filteredData.filter(sale => new Date(sale.date) <= new Date(endDate));
    }
    
    if (format === 'csv') {
      const csvContent = exportSalesDataToCSV(filteredData);
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="sales_data.csv"',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: filteredData,
      summary: {
        total_records: filteredData.length,
        total_revenue: filteredData.reduce((sum, sale) => sum + sale.revenue, 0),
        total_quantity: filteredData.reduce((sum, sale) => sum + sale.quantity_sold, 0)
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    console.error('Export sales data error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Health check
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}