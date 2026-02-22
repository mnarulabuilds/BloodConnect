
export interface Donor {
    id: string;
    name: string;
    bloodGroup: string;
    location: string;
    distance: string;
    lastDonated: string;
    phone: string;
    available: boolean;
    avatar: string;
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export interface Hospital {
    name: string;
    city: string;
}

export const KNOWN_HOSPITALS: Hospital[] = [
    // Delhi / NCR
    { name: 'AIIMS New Delhi', city: 'New Delhi' },
    { name: 'Safdarjung Hospital', city: 'New Delhi' },
    { name: 'Ram Manohar Lohia Hospital', city: 'New Delhi' },
    { name: 'Lady Hardinge Medical College', city: 'New Delhi' },
    { name: 'Lok Nayak Hospital', city: 'New Delhi' },
    { name: 'Max Super Speciality Hospital Saket', city: 'New Delhi' },
    { name: 'Apollo Hospital Indraprastha', city: 'New Delhi' },
    { name: 'Fortis Hospital Vasant Kunj', city: 'New Delhi' },
    { name: 'Medanta - The Medicity', city: 'Gurugram' },
    { name: 'Artemis Hospital', city: 'Gurugram' },
    { name: 'Fortis Memorial Research Institute', city: 'Gurugram' },
    { name: 'Yashoda Super Speciality Hospital', city: 'Ghaziabad' },
    // Mumbai
    { name: 'KEM Hospital', city: 'Mumbai' },
    { name: 'Lokmanya Tilak Municipal Hospital', city: 'Mumbai' },
    { name: 'Tata Memorial Hospital', city: 'Mumbai' },
    { name: 'Lilavati Hospital', city: 'Mumbai' },
    { name: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai' },
    { name: 'Breach Candy Hospital', city: 'Mumbai' },
    { name: 'Hinduja Hospital', city: 'Mumbai' },
    { name: 'Nanavati Max Super Speciality Hospital', city: 'Mumbai' },
    // Bengaluru
    { name: 'Manipal Hospital (Old Airport Road)', city: 'Bengaluru' },
    { name: 'Fortis Hospital Bannerghatta Road', city: 'Bengaluru' },
    { name: 'Apollo Hospital Bannerghatta Road', city: 'Bengaluru' },
    { name: 'Narayana Health City', city: 'Bengaluru' },
    { name: 'Victoria Hospital', city: 'Bengaluru' },
    { name: 'Bowring and Lady Curzon Hospital', city: 'Bengaluru' },
    // Chennai
    { name: 'Apollo Hospital Chennai', city: 'Chennai' },
    { name: 'MIOT International', city: 'Chennai' },
    { name: 'Government General Hospital Chennai', city: 'Chennai' },
    { name: 'Fortis Malar Hospital', city: 'Chennai' },
    { name: 'Sri Ramachandra Medical Centre', city: 'Chennai' },
    // Hyderabad
    { name: 'NIMS Hyderabad', city: 'Hyderabad' },
    { name: 'Apollo Hospital Jubilee Hills', city: 'Hyderabad' },
    { name: 'KIMS Hospital', city: 'Hyderabad' },
    { name: 'Yashoda Hospital Somajiguda', city: 'Hyderabad' },
    { name: 'Care Hospital Banjara Hills', city: 'Hyderabad' },
    // Kolkata
    { name: 'SSKM Hospital', city: 'Kolkata' },
    { name: 'Apollo Gleneagles Hospital', city: 'Kolkata' },
    { name: 'Medica Superspecialty Hospital', city: 'Kolkata' },
    { name: 'Fortis Hospital Anandapur', city: 'Kolkata' },
    // Other cities
    { name: 'PGI Chandigarh', city: 'Chandigarh' },
    { name: 'GMCH Chandigarh', city: 'Chandigarh' },
    { name: 'SMS Medical College Hospital', city: 'Jaipur' },
    { name: 'Sawai Man Singh Hospital', city: 'Jaipur' },
    { name: 'Fortis Escorts Hospital Jaipur', city: 'Jaipur' },
    { name: 'SGPGI Lucknow', city: 'Lucknow' },
    { name: 'King George Medical University', city: 'Lucknow' },
    { name: 'Ruby Hall Clinic', city: 'Pune' },
    { name: 'Jehangir Hospital', city: 'Pune' },
    { name: 'Sassoon General Hospital', city: 'Pune' },
    { name: 'Deenanath Mangeshkar Hospital', city: 'Pune' },
    { name: 'AIIMS Bhopal', city: 'Bhopal' },
    { name: 'Hamidia Hospital', city: 'Bhopal' },
    { name: 'AIIMS Patna', city: 'Patna' },
    { name: 'PMCH Patna', city: 'Patna' },
    { name: 'SCB Medical College Hospital', city: 'Cuttack' },
    { name: 'AIIMS Bhubaneswar', city: 'Bhubaneswar' },
    { name: 'AIIMS Jodhpur', city: 'Jodhpur' },
    { name: 'AIIMS Rishikesh', city: 'Rishikesh' },
    { name: 'AIIMS Raipur', city: 'Raipur' },
    { name: 'Amrita Institute of Medical Sciences', city: 'Kochi' },
    { name: 'Medical College Hospital Kozhikode', city: 'Kozhikode' },
    { name: 'Christian Medical College', city: 'Vellore' },
    { name: 'JIPMER', city: 'Puducherry' },
];

export const KNOWN_LOCATIONS: string[] = [
    'New Delhi', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad', 'Greater Noida',
    'Mumbai', 'Thane', 'Navi Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad',
    'Bengaluru', 'Mysuru', 'Mangaluru', 'Hubli', 'Belagavi',
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Vellore',
    'Hyderabad', 'Secunderabad', 'Warangal', 'Visakhapatnam', 'Vijayawada',
    'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri',
    'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer',
    'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut',
    'Chandigarh', 'Amritsar', 'Ludhiana', 'Jalandhar',
    'Bhopal', 'Indore', 'Gwalior', 'Jabalpur',
    'Patna', 'Gaya', 'Bhagalpur',
    'Bhubaneswar', 'Cuttack', 'Rourkela',
    'Raipur', 'Bilaspur',
    'Ranchi', 'Jamshedpur', 'Dhanbad',
    'Guwahati', 'Shillong', 'Dibrugarh',
    'Srinagar', 'Jammu', 'Leh',
    'Dehradun', 'Haridwar', 'Rishikesh',
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar',
    'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur',
    'Puducherry', 'Madurai', 'Salem',
    'Visakhapatnam', 'Guntur', 'Nellore',
    'Imphal', 'Aizawl', 'Agartala', 'Itanagar',
    'Port Blair', 'Panaji', 'Silvassa', 'Daman', 'Kavaratti',
];

