
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

export const mockDonors: Donor[] = [
    {
        id: '1',
        name: 'Mayank Kumar',
        bloodGroup: 'A+',
        location: 'New Delhi, India',
        distance: '2.5 km',
        lastDonated: '3 months ago',
        phone: '+91 98765 43210',
        available: true,
        avatar: 'https://i.pravatar.cc/150?u=1',
    },
    {
        id: '2',
        name: 'Sonia Sharma',
        bloodGroup: 'O+',
        location: 'Gurugram, India',
        distance: '5.2 km',
        lastDonated: '1 year ago',
        phone: '+91 98765 43211',
        available: true,
        avatar: 'https://i.pravatar.cc/150?u=2',
    },
    {
        id: '3',
        name: 'Rahul Varma',
        bloodGroup: 'B-',
        location: 'Mumbai, India',
        distance: '10 km',
        lastDonated: 'Freshly available',
        phone: '+91 98765 43212',
        available: true,
        avatar: 'https://i.pravatar.cc/150?u=3',
    },
    {
        id: '4',
        name: 'Anjali Gupta',
        bloodGroup: 'AB+',
        location: 'Bengaluru, India',
        distance: '15 km',
        lastDonated: '6 months ago',
        phone: '+91 98765 43213',
        available: false,
        avatar: 'https://i.pravatar.cc/150?u=4',
    },
    {
        id: '5',
        name: 'Vikram Singh',
        bloodGroup: 'O-',
        location: 'Jaipur, India',
        distance: '1.2 km',
        lastDonated: '2 months ago',
        phone: '+91 98765 43214',
        available: true,
        avatar: 'https://i.pravatar.cc/150?u=5',
    },
];
