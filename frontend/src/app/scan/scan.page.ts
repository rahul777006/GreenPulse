import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: false
})
export class ScanPage implements OnInit {
  plantDetails: any = null;
  loading = false;
  error = '';
  scannedImage: string | null = null;
  
  // Simple loading messages that cycle
  loadingMessages = [
    'Analyzing your plant... 🌱',
    'Searching our database... 🔍',
    'Almost ready... ✨',
    'Getting results... 🎯'
  ];
  currentMessageIndex = 0;

  private googleApiKey = 'AIzaSyCqucjLfdHlLZrGOHNqBcDhKlqY37WdE3I';
  private generativeAI: GoogleGenerativeAI;

  constructor(private http: HttpClient) {
    this.generativeAI = new GoogleGenerativeAI(this.googleApiKey);
  }

  ngOnInit() {
  }

  triggerFileInput() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error = 'Please select a valid image file.';
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Image size too large. Please select an image under 5MB.';
        return;
      }
      
      this.error = '';
      this.compressAndLoadImage(file);
    }
  }
  
  compressAndLoadImage(file: File) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate optimal dimensions (max 800px on longest side)
      const maxSize = 800;
      let { width, height } = img;
      
      if (width > height && width > maxSize) {
        height = (height / width) * maxSize;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width / height) * maxSize;
        height = maxSize;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      this.scannedImage = canvas.toDataURL('image/jpeg', 0.8);
    };
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  scanImage() {
    if (this.scannedImage) {
      this.identifyPlant(this.scannedImage);
    }
  }

  // UI Enhancement Methods
  clearImage(event: Event) {
    event.stopPropagation();
    this.scannedImage = null;
    this.error = '';
  }

  resetScan() {
    this.scannedImage = null;
    this.plantDetails = null;
    this.error = '';
    this.loading = false;
    this.currentMessageIndex = 0;
  }

  getConfidenceLevel(confidence: string): string {
    const percent = parseInt(confidence?.replace('%', '') || '0');
    if (percent >= 85) return 'high';
    if (percent >= 70) return 'medium';
    return 'low';
  }
  
  getConfidenceColor(confidence: string): string {
    const level = this.getConfidenceLevel(confidence);
    switch (level) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      default: return '#F44336';
    }
  }

  getPlantType(plantData: any): string {
    // Use the category from AI response if available
    if (plantData.category) {
      return plantData.category;
    }
    
    const name = plantData.name?.toLowerCase() || '';
    
    // More comprehensive plant type detection
    const categories = {
      'Houseplant': ['pothos', 'monstera', 'snake plant', 'spider plant', 'philodendron', 'peace lily'],
      'Vegetable': ['tomato', 'lettuce', 'carrot', 'potato', 'onion', 'pepper', 'cucumber', 'spinach'],
      'Fruit': ['apple', 'orange', 'banana', 'grape', 'strawberry', 'cherry', 'peach', 'mango'],
      'Herb': ['basil', 'mint', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'sage'],
      'Flower': ['rose', 'lily', 'tulip', 'daisy', 'sunflower', 'orchid', 'violet', 'petunia'],
      'Tree': ['oak', 'pine', 'maple', 'birch', 'cedar', 'willow', 'palm', 'fir'],
      'Succulent': ['aloe', 'cactus', 'jade', 'echeveria', 'sedum', 'agave'],
      'Fern': ['fern', 'boston fern', 'maidenhair'],
      'Grass': ['grass', 'bamboo', 'wheat', 'rice', 'corn']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return category;
      }
    }
    
    return 'Plant';
  }

  getGrowthTip(name: string): string {
    const tips = [
      'Rotate regularly for even growth',
      'Prune dead leaves to encourage new growth',
      'Monitor for pests and diseases',
      'Repot when roots outgrow container',
      'Group with other plants for humidity',
      'Use well-draining soil for best results'
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  showHistory() {
    const history = this.getScanHistory();
    console.log('Scan history:', history);
    // TODO: Implement history modal or navigation
    alert(`You have ${history.length} plants in your scan history!`);
  }

  getScanHistory() {
    try {
      return JSON.parse(localStorage.getItem('plantScanHistory') || '[]');
    } catch {
      return [];
    }
  }

  showTips() {
    const tips = [
      '📸 Take photos in good natural lighting',
      '🌿 Focus on distinctive leaves or flowers',
      '📏 Keep the plant centered in the frame',
      '🔍 Avoid blurry or distant shots',
      '🌱 Include multiple parts if possible (leaves, stems, flowers)',
      '☀️ Avoid harsh shadows or overexposure'
    ];
    
    const tipsList = tips.map(tip => `• ${tip}`).join('\n');
    alert(`📋 Photography Tips for Better Results:\n\n${tipsList}`);
    
    // TODO: Implement proper tips modal with better UI
  }

  saveToCollection() {
    if (this.plantDetails && this.plantDetails[0]) {
      try {
        const collection = JSON.parse(localStorage.getItem('myPlantCollection') || '[]');
        const plantToSave = {
          ...this.plantDetails[0],
          id: Date.now().toString(),
          addedAt: new Date().toISOString(),
          image: this.scannedImage,
          notes: ''
        };
        
        collection.unshift(plantToSave);
        localStorage.setItem('myPlantCollection', JSON.stringify(collection));
        
        // Show success message
        console.log('Plant saved to collection successfully!');
        // TODO: Show toast or success message
        alert('Plant saved to your collection!');
      } catch (error) {
        console.error('Error saving plant to collection:', error);
        alert('Error saving plant. Please try again.');
      }
    }
  }

  shareResult() {
    if (this.plantDetails && this.plantDetails[0]) {
      const shareData = {
        title: `Identified: ${this.plantDetails[0].name}`,
        text: `I just identified this plant using the Farmer App!`,
        url: window.location.href
      };
      
      if (navigator.share) {
        navigator.share(shareData);
      } else {
        console.log('Share functionality not available');
      }
    }
  }

  getMoreInfo() {
    console.log('Get more information about plant');
    // Navigate to detailed plant information
  }

  retryIdentification() {
    this.error = '';
    if (this.scannedImage) {
      this.identifyPlant(this.scannedImage);
    }
  }

  clearError() {
    this.error = '';
    this.scannedImage = null;
  }

  // Loading step tracking is already declared above

  async identifyPlant(imageBase64: string) {
    this.loading = true;
    this.error = '';
    this.plantDetails = null;
    this.currentMessageIndex = 0;
    
    // Start message cycling animation
    this.startLoadingAnimation();

    try {
      // Clean base64 string
      let base64Content = imageBase64;
      if (base64Content.indexOf('base64,') !== -1) {
        base64Content = base64Content.substring(base64Content.indexOf('base64,') + 7);
      }
      base64Content = base64Content.trim();

      // Enhanced AI prompt for comprehensive plant identification
      const prompt = `Analyze this plant image and provide detailed information in JSON format. Be as accurate as possible.
      
      Please identify:
      1. Plant name (common and scientific if possible)
      2. Confidence level (as percentage)
      3. Plant type/category
      4. Basic care requirements
      
      Respond ONLY with valid JSON in this exact format:
      {
        "name": "Common Plant Name",
        "scientificName": "Scientific Name",
        "confidence": "85%",
        "category": "Houseplant/Vegetable/Fruit/Herb/Flower/Tree",
        "watering": "Brief watering instruction",
        "sunlight": "Light requirement",
        "temperature": "Temperature range",
        "humidity": "Humidity preference",
        "fertilizer": "Fertilizer needs",
        "growthTime": "Time to maturity",
        "difficulty": "Easy/Medium/Hard",
        "tips": "One key growing tip"
      }`;

      const model = this.generativeAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const response = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: this.getMimeType(imageBase64),
            data: base64Content
          }
        }
      ]);
      
      const text = response.response.text();
      console.log('AI Response:', text);
      
      this.plantDetails = this.processEnhancedResponse(text);
      this.loading = false;
      
    } catch (err) {
      this.loading = false;
      this.error = 'Unable to identify the plant. Please ensure the image is clear and try again.';
      console.error('Plant identification error:', err);
    }
  }

  getMimeType(imageBase64: string): string {
    if (imageBase64.includes('data:image/jpeg') || imageBase64.includes('data:image/jpg')) {
      return 'image/jpeg';
    } else if (imageBase64.includes('data:image/png')) {
      return 'image/png';
    } else if (imageBase64.includes('data:image/webp')) {
      return 'image/webp';
    }
    return 'image/jpeg'; // default
  }

  processEnhancedResponse(text: string): any {
    try {
      // Clean the response text
      let cleanText = text.trim();
      
      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // Find JSON object in the response
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      console.log('Cleaned response:', cleanText);
      
      const plantData = JSON.parse(cleanText);
      
      // Validate and enhance the response
      const enhancedData = {
        name: plantData.name || 'Unknown Plant',
        scientificName: plantData.scientificName || '',
        confidence: plantData.confidence || '70%',
        category: plantData.category || 'Plant',
        watering: plantData.watering || 'Water when soil feels dry',
        sunlight: plantData.sunlight || 'Bright indirect light',
        temperature: plantData.temperature || '18-24°C',
        humidity: plantData.humidity || '40-60%',
        fertilizer: plantData.fertilizer || 'Monthly during growing season',
        growthTime: plantData.growthTime || 'Varies',
        difficulty: plantData.difficulty || 'Medium',
        tips: plantData.tips || 'Monitor regularly for best results',
        identifiedAt: new Date().toISOString()
      };
      
      // Store in history
      this.storePlantInHistory(enhancedData);
      
      return [enhancedData];
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw response:', text);
      
      // Fallback with basic extraction
      return this.createFallbackResponse(text);
    }
  }

  createFallbackResponse(text: string): any {
    const fallbackData = {
      name: this.extractPlantName(text) || 'Unidentified Plant',
      scientificName: '',
      confidence: '60%',
      category: 'Plant',
      watering: 'Water regularly, allow soil to dry between waterings',
      sunlight: 'Bright, indirect sunlight',
      temperature: '18-25°C',
      humidity: '40-60%',
      fertilizer: 'Balanced liquid fertilizer monthly',
      growthTime: 'Several months',
      difficulty: 'Medium',
      tips: 'Keep in well-draining soil and monitor for pests',
      identifiedAt: new Date().toISOString()
    };
    
    return [fallbackData];
  }

  extractPlantName(text: string): string | null {
    // Try to extract plant name from unstructured text
    const patterns = [
      /(?:plant|species).*?([A-Z][a-z]+\s+[a-z]+)/i,
      /([A-Z][a-z]+\s+[a-z]+).*?(?:plant|leaf|flower)/i,
      /(?:appears to be|looks like|identified as).*?([A-Z][a-z]+(?:\s+[a-z]+)?)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  storePlantInHistory(plantData: any) {
    try {
      const history = JSON.parse(localStorage.getItem('plantScanHistory') || '[]');
      const entry = {
        ...plantData,
        id: Date.now().toString(),
        image: this.scannedImage
      };
      
      history.unshift(entry);
      
      // Keep only last 20 entries
      if (history.length > 20) {
        history.splice(20);
      }
      
      localStorage.setItem('plantScanHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error storing plant in history:', error);
    }
  }

  showGrowthHistory() {
    // Navigate to growth history or show modal
    console.log('Show growth history');
    // This would typically navigate to a history page or show a modal
  }

  // Simple loading animation methods
  startLoadingAnimation() {
    const interval = setInterval(() => {
      if (!this.loading) {
        clearInterval(interval);
        return;
      }
      this.currentMessageIndex = (this.currentMessageIndex + 1) % this.loadingMessages.length;
    }, 2000); // Change message every 2 seconds
  }

  getCurrentLoadingMessage(): string {
    return this.loadingMessages[this.currentMessageIndex];
  }



}