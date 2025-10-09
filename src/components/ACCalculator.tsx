'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calculator, MapPin, Ruler, ArrowLeft, ArrowRight } from 'lucide-react';
import { productsData } from '@/data';

// Indian states list
const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep'
];

// Climate factors for different regions
const getClimateFactor = (state: string): number => {
  const hotStates = ['Rajasthan', 'Gujarat', 'Haryana', 'Punjab', 'Delhi', 'Uttar Pradesh'];
  const moderateStates = ['Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
  const coolStates = ['Himachal Pradesh', 'Uttarakhand', 'Jammu and Kashmir', 'Ladakh'];
  
  if (hotStates.includes(state)) return 1.2;
  if (moderateStates.includes(state)) return 1.0;
  if (coolStates.includes(state)) return 0.8;
  return 1.0; // Default for other states
};

interface FormData {
  state: string;
  length: string;
  width: string;
  height: string;
  people: string;
  temperature: string;
}

interface ACCalculatorProps {
  className?: string;
}

const ACCalculator: React.FC<ACCalculatorProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    state: '',
    length: '',
    width: '',
    height: '',
    people: '',
    temperature: ''
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTonnage = (): number => {
    const length = parseFloat(formData.length) || 0;
    const width = parseFloat(formData.width) || 0;
    const height = parseFloat(formData.height) || 0;
    const people = parseInt(formData.people) || 0;
    const temperature = parseFloat(formData.temperature) || 25;
    
    // Basic calculation: Room volume + people factor + temperature factor + climate factor
    const roomVolume = length * width * height;
    const baseLoad = roomVolume * 0.001; // Base load per cubic meter
    const peopleLoad = people * 0.1; // Additional load per person
    const tempFactor = Math.max(0, (temperature - 25) * 0.02); // Additional load for higher temperatures
    const climateFactor = getClimateFactor(formData.state);
    
    const totalTonnage = (baseLoad + peopleLoad + tempFactor) * climateFactor;
    return Math.max(0.8, totalTonnage); // Minimum 0.8 ton
  };

  const getRecommendations = () => {
    const requiredTonnage = calculateTonnage();
    const acProducts = productsData.find(p => p.id === 'air-conditioning')?.products || [];
    
    // Filter and sort products based on tonnage
    const suitable = acProducts.filter(product => {
      const tonnage = parseFloat(product.grossVolume.replace(/[^0-9.]/g, ''));
      return tonnage >= requiredTonnage * 0.8 && tonnage <= requiredTonnage * 1.3;
    }).sort((a, b) => {
      const tonnageA = parseFloat(a.grossVolume.replace(/[^0-9.]/g, ''));
      const tonnageB = parseFloat(b.grossVolume.replace(/[^0-9.]/g, ''));
      return Math.abs(tonnageA - requiredTonnage) - Math.abs(tonnageB - requiredTonnage);
    }).slice(0, 6); // Show top 6 recommendations
    
    setRecommendations(suitable);
  };

  const handleNext = () => {
    if (step === 1 && formData.state) {
      setStep(2);
    } else if (step === 2 && formData.length && formData.width && formData.height && formData.people && formData.temperature) {
      getRecommendations();
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetCalculator = () => {
    setStep(1);
    setFormData({
      state: '',
      length: '',
      width: '',
      height: '',
      people: '',
      temperature: ''
    });
    setRecommendations([]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetCalculator, 300); // Reset after dialog closes
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className={`bg-blue-900 hover:bg-blue-800 text-white font-medium px-6 py-2 md:px-8 md:py-3 text-sm md:text-base rounded-md transition-colors ${className}`}
          onClick={() => setIsOpen(true)}
        >
          <Calculator className="w-5 h-5 mr-2" />
          AC CALCULATOR
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-800">
            AC Calculator
          </DialogTitle>
          
          {/* Step Indicators */}
          <div className="flex justify-center items-center space-x-4 mt-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum === 1 && <MapPin className="w-5 h-5" />}
                  {stepNum === 2 && <Ruler className="w-5 h-5" />}
                  {stepNum === 3 && <Calculator className="w-5 h-5" />}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-0.5 ${
                    step > stepNum ? 'bg-blue-900' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Step 1: Location Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-blue-900 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Which state do you live in?</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">Select your state</Label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                >
                  <option value="">Choose your state...</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleNext}
                  disabled={!formData.state}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2"
                >
                  CONTINUE
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Room Specifications */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Ruler className="w-12 h-12 text-blue-900 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">What's the size of the room?</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length (m)</Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder="e.g., 4"
                    value={formData.length}
                    onChange={(e) => handleInputChange('length', e.target.value)}
                    className="focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="width">Width (m)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="e.g., 3"
                    value={formData.width}
                    onChange={(e) => handleInputChange('width', e.target.value)}
                    className="focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height">Height (m)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="e.g., 3"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    className="focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="people">Number of people</Label>
                  <Input
                    id="people"
                    type="number"
                    placeholder="e.g., 2"
                    value={formData.people}
                    onChange={(e) => handleInputChange('people', e.target.value)}
                    className="focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="temperature">Outside Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    placeholder="e.g., 35"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                    className="focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  className="px-6 py-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  BACK
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!formData.length || !formData.width || !formData.height || !formData.people || !formData.temperature}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2"
                >
                  CONTINUE
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <Calculator className="w-12 h-12 text-blue-900 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Recommended AC Units</h3>
                <p className="text-sm text-gray-600">
                  Based on your room size ({formData.length}m × {formData.width}m × {formData.height}m) 
                  and {formData.people} people, we recommend {calculateTonnage().toFixed(1)} ton capacity.
                </p>
              </div>
              
              {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {recommendations.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <img 
                        src={product.imageUrl} 
                        alt={product.productTitle}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                      <h4 className="font-medium text-sm mb-2 line-clamp-2">{product.productTitle}</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p><span className="font-medium">Capacity:</span> {product.grossVolume}</p>
                        <p><span className="font-medium">Rating:</span> {product.energyRating}</p>
                        <p><span className="font-medium">Brand:</span> {product.brand}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-blue-900">₹{product.price.toLocaleString()}</span>
                          {product.mrp > product.price && (
                            <span className="text-xs text-gray-500 line-through ml-2">₹{product.mrp.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          View Details
                        </Button>
                        <Button size="sm" className="flex-1 bg-blue-900 hover:bg-blue-800 text-xs">
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No suitable AC units found for your requirements.</p>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  className="px-6 py-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  BACK
                </Button>
                <Button 
                  onClick={handleClose}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2"
                >
                  Close Calculator
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ACCalculator;