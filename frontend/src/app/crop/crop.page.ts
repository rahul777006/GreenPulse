import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface CropRecommendation {
  recommendations: string;
  language: string;
  timestamp: Date;
}

@Component({
  selector: 'app-crop',
  templateUrl: './crop.page.html',
  styleUrls: ['./crop.page.scss'],
  standalone: false,
})

export class CropPage implements OnInit {

  cropForm: FormGroup;
  isSubmitting = false;
  aiResponse: string = '';
  showResponse = false;
  selectedLanguage = 'English';
  currentLanguage = 'English'; // Track current UI language
  location = '';
  isPlaying = false;
  currentAudio: HTMLAudioElement | null = null;
  showFullResponse = false;
  isGeneratingAudio = false;
  // Language options
  languages = [
    { code: 'en', name: 'English', display: 'English' },
    { code: 'hi', name: 'Hindi', display: 'हिंदी' },
    { code: 'pa', name: 'Punjabi', display: 'ਪੰਜਾਬੀ' }
  ];

  // Translations for UI text
  translations = {
    English: {
      title: 'Smart Crop Advisor',
      subtitle: 'Get personalized, smart recommendations for your farm',
      smartAnalysis: 'Smart Analysis',
      maxProfit: 'Max Profit',
      expertAdvice: 'Expert Advice',
      preferredLanguage: 'Preferred Language',
      farmDetails: 'Farm Details',
      location: 'Location (City/District)',
      locationPlaceholder: 'e.g., Ludhiana, Punjab',
      soilType: 'Soil Type',
      farmSize: 'Farm Size',
      environmentalConditions: 'Environmental Conditions',
      climateType: 'Climate Type',
      waterAvailability: 'Water Availability',
      plantingSeason: 'Planting Season',
      budgetExperience: 'Budget & Experience',
      budget: 'Budget (₹)',
      budgetPlaceholder: '50000',
      farmingExperience: 'Farming Experience',
      additionalInfo: 'Additional Information (Optional)',
      previousCrops: 'Previous Crops Grown',
      previousCropsPlaceholder: 'e.g., Wheat, Rice, Cotton',
      specificRequirements: 'Specific Requirements/Goals',
      specificRequirementsPlaceholder: 'e.g., High profit, Low water usage, Organic farming',
      getRecommendations: 'Get AI Recommendations',
      analyzing: 'Analyzing your data...',
      cropRecommendations: '🌾 Your Crop Recommendations',
      aiPoweredSuggestions: 'AI-powered suggestions for',
      stopAudio: 'Stop Audio',
      listenAudio: 'Listen (AI Voice)',
      generating: 'Generating...',
      readMore: 'Read More',
      shareRecommendations: 'Share Recommendations',
      getNewRecommendations: 'Get New Recommendations'
    },
    Hindi: {
      title: 'स्मार्ट फसल सलाहकार',
      subtitle: 'अपने खेत के लिए व्यक्तिगत, स्मार्ट सिफारिशें प्राप्त करें',
      smartAnalysis: 'स्मार्ट विश्लेषण',
      maxProfit: 'अधिकतम लाभ',
      expertAdvice: 'विशेषज्ञ सलाह',
      preferredLanguage: 'पसंदीदा भाषा',
      farmDetails: 'खेत का विवरण',
      location: 'स्थान (शहर/जिला)',
      locationPlaceholder: 'जैसे, लुधियाना, पंजाब',
      soilType: 'मिट्टी का प्रकार',
      farmSize: 'खेत का आकार',
      environmentalConditions: 'पर्यावरणीय स्थितियां',
      climateType: 'जलवायु प्रकार',
      waterAvailability: 'पानी की उपलब्धता',
      plantingSeason: 'बुआई का मौसम',
      budgetExperience: 'बजट और अनुभव',
      budget: 'बजट (₹)',
      budgetPlaceholder: '50000',
      farmingExperience: 'खेती का अनुभव',
      additionalInfo: 'अतिरिक्त जानकारी (वैकल्पिक)',
      previousCrops: 'पहले उगाई गई फसलें',
      previousCropsPlaceholder: 'जैसे, गेहूं, चावल, कपास',
      specificRequirements: 'विशिष्ट आवश्यकताएं/लक्ष्य',
      specificRequirementsPlaceholder: 'जैसे, उच्च लाभ, कम पानी का उपयोग, जैविक खेती',
      getRecommendations: 'AI सिफारिशें प्राप्त करें',
      analyzing: 'आपके डेटा का विश्लेषण कर रहे हैं...',
      cropRecommendations: '🌾 आपकी फसल सिफारिशें',
      aiPoweredSuggestions: 'के लिए AI-आधारित सुझाव',
      stopAudio: 'ऑडियो बंद करें',
      listenAudio: 'सुनें (AI आवाज़)',
      generating: 'तैयार कर रहे हैं...',
      readMore: 'और पढ़ें',
      shareRecommendations: 'सिफारिशें साझा करें',
      getNewRecommendations: 'नई सिफारिशें प्राप्त करें'
    },
    Punjabi: {
      title: 'ਸਮਾਰਟ ਫਸਲ ਸਲਾਹਕਾਰ',
      subtitle: 'ਆਪਣੇ ਖੇਤ ਲਈ ਵਿਅਕਤੀਗਤ, ਸਮਾਰਟ ਸਿਫਾਰਸ਼ਾਂ ਪ੍ਰਾਪਤ ਕਰੋ',
      smartAnalysis: 'ਸਮਾਰਟ ਵਿਸ਼ਲੇਸ਼ਣ',
      maxProfit: 'ਵੱਧ ਤੋਂ ਵੱਧ ਮੁਨਾਫਾ',
      expertAdvice: 'ਮਾਹਰ ਸਲਾਹ',
      preferredLanguage: 'ਤਰਜੀਹੀ ਭਾਸ਼ਾ',
      farmDetails: 'ਖੇਤ ਦਾ ਵੇਰਵਾ',
      location: 'ਸਥਾਨ (ਸ਼ਹਿਰ/ਜ਼ਿਲ੍ਹਾ)',
      locationPlaceholder: 'ਜਿਵੇਂ, ਲੁਧਿਆਣਾ, ਪੰਜਾਬ',
      soilType: 'ਮਿੱਟੀ ਦੀ ਕਿਸਮ',
      farmSize: 'ਖੇਤ ਦਾ ਆਕਾਰ',
      environmentalConditions: 'ਵਾਤਾਵਰਣ ਸਬੰਧੀ ਸਥਿਤੀਆਂ',
      climateType: 'ਜਲਵਾਯੂ ਦੀ ਕਿਸਮ',
      waterAvailability: 'ਪਾਣੀ ਦੀ ਉਪਲਬਧਤਾ',
      plantingSeason: 'ਬੀਜਾਈ ਦਾ ਮੌਸਮ',
      budgetExperience: 'ਬਜਟ ਅਤੇ ਤਜਰਬਾ',
      budget: 'ਬਜਟ (₹)',
      budgetPlaceholder: '50000',
      farmingExperience: 'ਖੇਤੀ ਦਾ ਤਜਰਬਾ',
      additionalInfo: 'ਵਾਧੂ ਜਾਣਕਾਰੀ (ਵਿਕਲਪਿਕ)',
      previousCrops: 'ਪਹਿਲਾਂ ਉਗਾਈਆਂ ਗਈਆਂ ਫਸਲਾਂ',
      previousCropsPlaceholder: 'ਜਿਵੇਂ, ਕਣਕ, ਚਾਵਲ, ਕਪਾਹ',
      specificRequirements: 'ਖਾਸ ਲੋੜਾਂ/ਟੀਚੇ',
      specificRequirementsPlaceholder: 'ਜਿਵੇਂ, ਜ਼ਿਆਦਾ ਮੁਨਾਫਾ, ਘੱਟ ਪਾਣੀ ਵਰਤੋਂ, ਜੈਵਿਕ ਖੇਤੀ',
      getRecommendations: 'AI ਸਿਫਾਰਸ਼ਾਂ ਪ੍ਰਾਪਤ ਕਰੋ',
      analyzing: 'ਤੁਹਾਡੇ ਡੇਟਾ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਹੇ ਹਾਂ...',
      cropRecommendations: '🌾 ਤੁਹਾਡੀਆਂ ਫਸਲ ਸਿਫਾਰਸ਼ਾਂ',
      aiPoweredSuggestions: 'ਲਈ AI-ਆਧਾਰਿਤ ਸੁਝਾਅ',
      stopAudio: 'ਆਡੀਓ ਬੰਦ ਕਰੋ',
      listenAudio: 'ਸੁਣੋ (AI ਆਵਾਜ਼)',
      generating: 'ਤਿਆਰ ਕਰ ਰਹੇ ਹਾਂ...',
      readMore: 'ਹੋਰ ਪੜ੍ਹੋ',
      shareRecommendations: 'ਸਿਫਾਰਸ਼ਾਂ ਸਾਂਝੀਆਂ ਕਰੋ',
      getNewRecommendations: 'ਨਵੀਆਂ ਸਿਫਾਰਸ਼ਾਂ ਪ੍ਰਾਪਤ ਕਰੋ'
    }
  };

  // Soil types with translations
  soilTypesData = {
    English: [
      { value: 'Clay', label: 'Clay' },
      { value: 'Sandy', label: 'Sandy' },
      { value: 'Loamy', label: 'Loamy' },
      { value: 'Silt', label: 'Silt' },
      { value: 'Peaty', label: 'Peaty' },
      { value: 'Chalky', label: 'Chalky' },
      { value: 'Saline', label: 'Saline' }
    ],
    Hindi: [
      { value: 'Clay', label: 'मिट्टी (चिकनी)' },
      { value: 'Sandy', label: 'रेतीली मिट्टी' },
      { value: 'Loamy', label: 'दोमट मिट्टी' },
      { value: 'Silt', label: 'गाद मिट्टी' },
      { value: 'Peaty', label: 'पीट मिट्टी' },
      { value: 'Chalky', label: 'चाकी मिट्टी' },
      { value: 'Saline', label: 'खारी मिट्टी' }
    ],
    Punjabi: [
      { value: 'Clay', label: 'ਮਿੱਟੀ (ਚਿਕਨੀ)' },
      { value: 'Sandy', label: 'ਰੇਤਲੀ ਮਿੱਟੀ' },
      { value: 'Loamy', label: 'ਦੋਮਟ ਮਿੱਟੀ' },
      { value: 'Silt', label: 'ਗਾਦ ਮਿੱਟੀ' },
      { value: 'Peaty', label: 'ਪੀਟ ਮਿੱਟੀ' },
      { value: 'Chalky', label: 'ਚਾਕੀ ਮਿੱਟੀ' },
      { value: 'Saline', label: 'ਖਾਰੀ ਮਿੱਟੀ' }
    ]
  };

  // Climate conditions with translations
  climateTypesData = {
    English: [
      { value: 'Tropical', label: 'Tropical' },
      { value: 'Subtropical', label: 'Subtropical' },
      { value: 'Temperate', label: 'Temperate' },
      { value: 'Arid', label: 'Arid' },
      { value: 'Semi-arid', label: 'Semi-arid' },
      { value: 'Mediterranean', label: 'Mediterranean' }
    ],
    Hindi: [
      { value: 'Tropical', label: 'उष्णकटिबंधीय' },
      { value: 'Subtropical', label: 'उपोष्णकटिबंधीय' },
      { value: 'Temperate', label: 'समशीतोष्ण' },
      { value: 'Arid', label: 'शुष्क' },
      { value: 'Semi-arid', label: 'अर्धशुष्क' },
      { value: 'Mediterranean', label: 'भूमध्यसागरीय' }
    ],
    Punjabi: [
      { value: 'Tropical', label: 'ਖੰਡੀ' },
      { value: 'Subtropical', label: 'ਉਪਖੰਡੀ' },
      { value: 'Temperate', label: 'ਸਮਸ਼ੀਤੋਸ਼ਣ' },
      { value: 'Arid', label: 'ਸੁੱਕਾ' },
      { value: 'Semi-arid', label: 'ਅਰਧ-ਸੁੱਕਾ' },
      { value: 'Mediterranean', label: 'ਭੂਮੱਧਸਾਗਰੀ' }
    ]
  };

  // Water availability with translations
  waterSourcesData = {
    English: [
      { value: 'Abundant (River/Canal)', label: 'Abundant (River/Canal)' },
      { value: 'Moderate (Bore well)', label: 'Moderate (Bore well)' },
      { value: 'Limited (Rain dependent)', label: 'Limited (Rain dependent)' },
      { value: 'Very Limited (Drought prone)', label: 'Very Limited (Drought prone)' }
    ],
    Hindi: [
      { value: 'Abundant (River/Canal)', label: 'प्रचुर (नदी/नहर)' },
      { value: 'Moderate (Bore well)', label: 'मध्यम (बोरवेल)' },
      { value: 'Limited (Rain dependent)', label: 'सीमित (बारिश पर निर्भर)' },
      { value: 'Very Limited (Drought prone)', label: 'बहुत सीमित (सूखा प्रवण)' }
    ],
    Punjabi: [
      { value: 'Abundant (River/Canal)', label: 'ਬਹੁਤ (ਨਦੀ/ਨਹਿਰ)' },
      { value: 'Moderate (Bore well)', label: 'ਮੱਧਮ (ਬੋਰਵੈੱਲ)' },
      { value: 'Limited (Rain dependent)', label: 'ਸੀਮਤ (ਬਰਸਾਤ ਤੇ ਨਿਰਭਰ)' },
      { value: 'Very Limited (Drought prone)', label: 'ਬਹੁਤ ਸੀਮਤ (ਸੋਕਾ ਪ੍ਰਵਾਣ)' }
    ]
  };

  // Farm sizes with translations
  farmSizesData = {
    English: [
      { value: 'Small (< 2 acres)', label: 'Small (< 2 acres)' },
      { value: 'Medium (2-10 acres)', label: 'Medium (2-10 acres)' },
      { value: 'Large (10-50 acres)', label: 'Large (10-50 acres)' },
      { value: 'Very Large (> 50 acres)', label: 'Very Large (> 50 acres)' }
    ],
    Hindi: [
      { value: 'Small (< 2 acres)', label: 'छोटा (< 2 एकड़)' },
      { value: 'Medium (2-10 acres)', label: 'मध्यम (2-10 एकड़)' },
      { value: 'Large (10-50 acres)', label: 'बड़ा (10-50 एकड़)' },
      { value: 'Very Large (> 50 acres)', label: 'बहुत बड़ा (> 50 एकड़)' }
    ],
    Punjabi: [
      { value: 'Small (< 2 acres)', label: 'ਛੋਟਾ (< 2 ਏਕੜ)' },
      { value: 'Medium (2-10 acres)', label: 'ਮੱਧਮ (2-10 ਏਕੜ)' },
      { value: 'Large (10-50 acres)', label: 'ਵੱਡਾ (10-50 ਏਕੜ)' },
      { value: 'Very Large (> 50 acres)', label: 'ਬਹੁਤ ਵੱਡਾ (> 50 ਏਕੜ)' }
    ]
  };

  // Seasons with translations
  seasonsData = {
    English: [
      { value: 'Kharif (Monsoon)', label: 'Kharif (Monsoon)' },
      { value: 'Rabi (Winter)', label: 'Rabi (Winter)' },
      { value: 'Zaid (Summer)', label: 'Zaid (Summer)' },
      { value: 'Year Round', label: 'Year Round' }
    ],
    Hindi: [
      { value: 'Kharif (Monsoon)', label: 'खरीफ (मानसून)' },
      { value: 'Rabi (Winter)', label: 'रबी (सर्दी)' },
      { value: 'Zaid (Summer)', label: 'जायद (गर्मी)' },
      { value: 'Year Round', label: 'पूरे साल' }
    ],
    Punjabi: [
      { value: 'Kharif (Monsoon)', label: 'ਖਰੀਫ (ਮਾਨਸੂਨ)' },
      { value: 'Rabi (Winter)', label: 'ਰਬੀ (ਸਰਦੀ)' },
      { value: 'Zaid (Summer)', label: 'ਜ਼ਾਇਦ (ਗਰਮੀ)' },
      { value: 'Year Round', label: 'ਸਾਰਾ ਸਾਲ' }
    ]
  };

  // Experience levels with translations
  experienceLevelsData = {
    English: [
      { value: 'Beginner (0-2 years)', label: 'Beginner (0-2 years)' },
      { value: 'Intermediate (3-10 years)', label: 'Intermediate (3-10 years)' },
      { value: 'Experienced (10+ years)', label: 'Experienced (10+ years)' }
    ],
    Hindi: [
      { value: 'Beginner (0-2 years)', label: 'शुरुआती (0-2 साल)' },
      { value: 'Intermediate (3-10 years)', label: 'मध्यम (3-10 साल)' },
      { value: 'Experienced (10+ years)', label: 'अनुभवी (10+ साल)' }
    ],
    Punjabi: [
      { value: 'Beginner (0-2 years)', label: 'ਸ਼ੁਰੂਆਤੀ (0-2 ਸਾਲ)' },
      { value: 'Intermediate (3-10 years)', label: 'ਮੱਧਮ (3-10 ਸਾਲ)' },
      { value: 'Experienced (10+ years)', label: 'ਤਜਰਬੇਕਾਰ (10+ ਸਾਲ)' }
    ]
  };

  private genAI!: GoogleGenerativeAI;
  private model: any;

  constructor(
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private http: HttpClient
  ) {
    // Initialize Google Generative AI
    const apiKey = environment.geminiApiKey;
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    }

    this.cropForm = this.formBuilder.group({
      location: ['', [Validators.required, Validators.minLength(2)]],
      soilType: ['', Validators.required],
      climate: ['', Validators.required],
      waterAvailability: ['', Validators.required],
      farmSize: ['', Validators.required],
      season: ['', Validators.required],
      budget: ['', [Validators.required, Validators.min(1000)]],
      experience: ['', Validators.required],
      previousCrops: [''],
      specificRequirements: [''],
      language: ['English', Validators.required]
    });
  }

  ngOnInit() {
    // Set default language and location from localStorage
    this.location = localStorage.getItem('city')+', '+localStorage.getItem('state');
    this.cropForm.patchValue({ language: 'English' });
    
    // Listen for language changes in the form
    this.cropForm.get('language')?.valueChanges.subscribe(language => {
      if (language) {
        this.currentLanguage = language;
      }
    });
    
    // Check if GenAI is properly initialized
    if (!this.model) {
      console.warn('Gemini AI not initialized. Please check your API key in environment file.');
    }
  }

  // Get current translations based on selected language
  get t() {
    return this.translations[this.currentLanguage as keyof typeof this.translations] || this.translations.English;
  }

  // Getter methods for translated options
  get soilTypes() {
    return this.soilTypesData[this.currentLanguage as keyof typeof this.soilTypesData] || this.soilTypesData.English;
  }

  get climateTypes() {
    return this.climateTypesData[this.currentLanguage as keyof typeof this.climateTypesData] || this.climateTypesData.English;
  }

  get waterSources() {
    return this.waterSourcesData[this.currentLanguage as keyof typeof this.waterSourcesData] || this.waterSourcesData.English;
  }

  get farmSizes() {
    return this.farmSizesData[this.currentLanguage as keyof typeof this.farmSizesData] || this.farmSizesData.English;
  }

  get seasons() {
    return this.seasonsData[this.currentLanguage as keyof typeof this.seasonsData] || this.seasonsData.English;
  }

  get experienceLevels() {
    return this.experienceLevelsData[this.currentLanguage as keyof typeof this.experienceLevelsData] || this.experienceLevelsData.English;
  }

  async getCropRecommendation() {
    if (this.cropForm.valid && !this.isSubmitting) {
      // Check if GenAI is initialized before proceeding
      if (!this.model) {
        await this.showToast('Gemini AI is not properly configured. Please contact administrator.', 'danger');
        return;
      }

      this.isSubmitting = true;
      
      const loading = await this.loadingController.create({
        message: 'Getting AI recommendations...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const formData = this.cropForm.value;
        const prompt = this.buildGeminiPrompt(formData);
        
        const response = await this.callGeminiAI(prompt, formData.language);
        
        if (response) {
          this.aiResponse = response;
          this.showResponse = true;
          this.selectedLanguage = formData.language;
          await this.showToast('Crop recommendations generated successfully!', 'success');
        } else {
          await this.showToast('Failed to get recommendations. Please try again.', 'danger');
        }
      } catch (error: any) {
        console.error('Error getting crop recommendations:', error);
        
        // Show specific error message if available
        const errorMessage = error?.message || 'An error occurred. Please check your internet connection and try again.';
        await this.showToast(errorMessage, 'danger');
      } finally {
        await loading.dismiss();
        this.isSubmitting = false;
      }
    } else {
      await this.showValidationErrors();
    }
  }

  private buildGeminiPrompt(formData: any): string {
    const languageInstruction = this.getLanguageInstruction(formData.language);
    
    return `You are an expert agricultural advisor. Provide CONCISE crop recommendations for:

**Farm Details:**
- Location: ${formData.location}
- Soil: ${formData.soilType}, Climate: ${formData.climate}
- Water: ${formData.waterAvailability}, Size: ${formData.farmSize}
- Season: ${formData.season}, Budget: ₹${formData.budget}
- Experience: ${formData.experience}

**IMPORTANT: Keep response under 300 words. Provide:**

🌾 **TOP 2 CROPS:**
1. [Crop Name] - [2-line reason]
2. [Crop Name] - [2-line reason]

💰 **PROFIT POTENTIAL:**
- Expected return: [brief estimate]

🚜 **KEY TIPS:**
- [3 most important farming tips]

⚠️ **MAIN CHALLENGES:**
- [2 key challenges and solutions]

${languageInstruction}

Be concise, practical, and farmer-friendly.`;
  }

  private getLanguageInstruction(language: string): string {
    switch (language) {
      case 'Hindi':
        return 'कृपया अपना उत्तर हिंदी में दें।';
      case 'Punjabi':
        return 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਜਵਾਬ ਪੰਜਾਬੀ ਵਿੱਚ ਦਿਓ।';
      default:
        return 'Please provide your response in English.';
    }
  }

  private async callGeminiAI(prompt: string, language: string): Promise<string | null> {
    try {
      // Check if GenAI is properly initialized
      if (!this.model) {
        throw new Error('Gemini AI not properly initialized. Please check your API key.');
      }

      // Generate content using the official SDK
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text && text.trim()) {
        return text;
      } else {
        throw new Error('Empty response from Gemini AI');
      }
    } catch (error: any) {
      console.error('Gemini AI API error:', error);
      
      // Handle specific error types
      if (error?.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your configuration.');
      } else if (error?.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('Gemini API quota exceeded. Please try again later.');
      } else if (error?.message?.includes('SAFETY')) {
        throw new Error('Content was blocked by safety filters. Please try with different input.');
      }
      
      return null;
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  async showValidationErrors() {
    const errors: string[] = [];
    
    Object.keys(this.cropForm.controls).forEach(key => {
      const control = this.cropForm.get(key);
      if (control && control.invalid && (control.dirty || control.touched)) {
        if (control.errors?.['required']) {
          errors.push(`${this.getFieldLabel(key)} is required`);
        }
        if (control.errors?.['minlength']) {
          errors.push(`${this.getFieldLabel(key)} must be at least ${control.errors['minlength'].requiredLength} characters`);
        }
        if (control.errors?.['min']) {
          errors.push(`${this.getFieldLabel(key)} must be at least ₹${control.errors['min'].min}`);
        }
      }
    });

    if (errors.length > 0) {
      await this.showToast(errors.join('\n'), 'danger');
    }
  }

  private getFieldLabel(fieldName: string): string {
    const labels: {[key: string]: string} = {
      'location': 'Location',
      'soilType': 'Soil Type',
      'climate': 'Climate',
      'waterAvailability': 'Water Availability',
      'farmSize': 'Farm Size',
      'season': 'Season',
      'budget': 'Budget',
      'experience': 'Experience',
      'language': 'Language'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.cropForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  resetForm() {
    this.stopSpeech();
    this.cropForm.reset();
    this.cropForm.patchValue({ language: 'English' });
    this.aiResponse = '';
    this.showResponse = false;
    this.showFullResponse = false;
    this.isSubmitting = false;
  }

  // ElevenLabs Text-to-Speech functionality
  async toggleSpeech() {
    if (this.isPlaying) {
      this.stopSpeech();
    } else {
      await this.startSpeech();
    }
  }

  async startSpeech() {
    if (!this.aiResponse) {
      await this.showToast('No content to read', 'warning');
      return;
    }

    // Check if ElevenLabs API key is configured
    const apiKey = environment.elevenLabsApiKey;
    if (!apiKey || apiKey === 'YOUR_ELEVENLABS_API_KEY') {
      await this.showToast('ElevenLabs API key not configured', 'warning');
      return;
    }

    this.isGeneratingAudio = true;
    
    const loading = await this.loadingController.create({
      message: 'Generating high-quality audio...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.stopSpeech(); // Stop any current audio
      
      const cleanText = this.cleanTextForSpeech(this.aiResponse);
      const audioUrl = await this.generateElevenLabsAudio(cleanText);
      
      if (audioUrl) {
        // Dismiss loading before playing audio
        await loading.dismiss();
        await this.playAudio(audioUrl);
      } else {
        await loading.dismiss();
        await this.showToast('Failed to generate audio. Please try again.', 'danger');
      }
    } catch (error) {
      console.error('Speech generation error:', error);
      await loading.dismiss();
      await this.showToast('Error generating speech. Please check your connection.', 'danger');
    } finally {
      this.isGeneratingAudio = false;
    }
  }

  private async generateElevenLabsAudio(text: string): Promise<string | null> {
    try {
      const apiKey = environment.elevenLabsApiKey;
      
      // Get voice ID based on selected language
      const voiceId = this.getVoiceIdForLanguage(this.selectedLanguage);
      
      const response = await this.http.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      ).toPromise();

      if (response) {
        // Create blob URL for audio playback
        const audioBlob = new Blob([response], { type: 'audio/mpeg' });
        return URL.createObjectURL(audioBlob);
      }
      
      return null;
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      return null;
    }
  }

  private getVoiceIdForLanguage(language: string): string {
    // ElevenLabs voice IDs for different languages
    // Replace these with actual voice IDs from your ElevenLabs account
    switch (language) {
      case 'Hindi':
        return 'pNInz6obpgDQGcFmaJgB'; // Adam (multilingual)
      case 'Punjabi':
        return '21m00Tcm4TlvDq8ikWAM'; // Rachel (multilingual)
      default:
        return 'EXAVITQu4vr4xnSDxMaL'; // Bella (English)
    }
  }

  private async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onloadstart = () => {
        this.isPlaying = true;
      };
      
      this.currentAudio.onended = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl); // Clean up blob URL
        resolve();
      };
      
      this.currentAudio.onerror = (error) => {
        this.isPlaying = false;
        this.currentAudio = null;
        URL.revokeObjectURL(audioUrl); // Clean up blob URL
        reject(error);
      };
      
      this.currentAudio.play().catch(reject);
    });
  }

  stopSpeech() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }


  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/[🌾💰🚜⚠️]/g, '') // Remove emojis
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/- /g, '') // Remove bullet points
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  toggleFullResponse() {
    this.showFullResponse = !this.showFullResponse;
  }

  getShortResponse(): string {
    if (!this.aiResponse) return '';
    const words = this.aiResponse.split(' ');
    return words.length > 50 ? words.slice(0, 50).join(' ') + '...' : this.aiResponse;
  }

  async shareRecommendations() {
    if (this.aiResponse) {
      const alert = await this.alertController.create({
        header: 'Share Recommendations',
        message: 'Choose how you want to share these crop recommendations:',
        buttons: [
          {
            text: 'Copy to Clipboard',
            handler: () => {
              navigator.clipboard.writeText(this.aiResponse);
              this.showToast('Recommendations copied to clipboard!', 'success');
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
    }
  }

  // Helper method to check GenAI configuration
  private isGenAIConfigured(): boolean {
    const apiKey = environment.geminiApiKey;
    return !!(apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' && this.model);
  }

  // Method to test GenAI connection (can be called for debugging)
  async testGenAIConnection(): Promise<boolean> {
    try {
      if (!this.isGenAIConfigured()) {
        console.error('GenAI not properly configured');
        return false;
      }

      const result = await this.model.generateContent('Test connection');
      const response = await result.response;
      const text = response.text();
      
      console.log('GenAI connection test successful:', text.substring(0, 50) + '...');
      return true;
    } catch (error) {
      console.error('GenAI connection test failed:', error);
      return false;
    }
  }
}
