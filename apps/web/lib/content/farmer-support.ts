// Public information directory, separate from the reviewed agronomic rule catalog.
// Never infer personal eligibility or collect application/KYC documents here.
export type SupportCategory = 'schemes' | 'loans' | 'insurance';
export type SupportEntry = {
  id: string; name: string; provider: string; categories: SupportCategory[];
  summary: string; benefit: string; audience: string; prepare: string[];
  caution: string; availability: string; checked_on: string;
  source: { label: string; url: string }; portal: { label: string; url: string };
};
const checked_on = '2026-10-09';
export const FARMER_SUPPORT: readonly SupportEntry[] = [
  {
    id: 'pm-kisan', name: 'PM-KISAN', provider: 'Department of Agriculture & Farmers Welfare', categories: ['schemes'],
    summary: 'Income support for eligible landholding farmer families.', benefit: '₹6,000 per year in three equal instalments.',
    audience: 'Landholding farmer families, subject to the official exclusion rules and government verification. The old two-hectare cap is not the current general rule.',
    prepare: ['Check land-record details, bank details and eKYC requirements on the official portal.'],
    caution: 'Institutional landholders and specified higher-income categories are excluded. Check the full exclusion list and your status with the responsible office.',
    availability: 'Eligibility and beneficiary status require official verification.', checked_on,
    source: { label: 'PM-KISAN scheme and exclusions', url: 'https://www.pmkisan.gov.in/' },
    portal: { label: 'Open PM-KISAN portal', url: 'https://pmkisan.gov.in/' },
  },
  {
    id: 'kcc', name: 'Kisan Credit Card (KCC)', provider: 'Participating banks', categories: ['schemes', 'loans'],
    summary: 'Credit for cultivation, post-harvest and eligible allied activities.', benefit: 'A bank-assessed credit facility; ask your branch for current terms.',
    audience: 'Owner-cultivators, tenant farmers, oral lessees, sharecroppers and eligible SHGs/JLGs.',
    prepare: ['Ask the bank or CSC for its KCC form and current cultivation, identity and land-record requirements.'],
    caution: 'The March 2026 government note reports a ₹5 lakh MISS limit, but describes the 7% rate and prompt-repayment incentive for loans up to ₹3 lakh. Do not assume every loan receives 4% interest.',
    availability: 'Sanction, rate and repayment incentive must be confirmed by the bank.', checked_on,
    source: { label: 'PIB: KCC, 11 March 2026', url: 'https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=157771&lang=1&reg=3' },
    portal: { label: 'Official KCC information', url: 'https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=157771&lang=1&reg=3' },
  },
  {
    id: 'pmfby', name: 'PM Fasal Bima Yojana (PMFBY)', provider: 'Department of Agriculture & Farmers Welfare', categories: ['schemes', 'insurance'],
    summary: 'Crop insurance for notified crops and areas, subject to the policy.',
    benefit: 'Farmer premium caps: 2% for Kharif food/oilseed crops, 1.5% for Rabi food/oilseed crops, 5% for annual commercial/horticultural crops.',
    audience: 'Farmers cultivating a notified crop in a notified area. Participation is voluntary.',
    prepare: ['Confirm the current district/crop notification, enrolment deadline, sum insured and required cultivation documents.'],
    caution: 'Percentages apply to the sum insured; coverage, exclusions and claim deadlines depend on the notified policy. This directory does not confirm Sehore enrolment availability.',
    availability: 'Check the current season notification and deadline.', checked_on,
    source: { label: 'PIB: crop insurance, 10 March 2026', url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2237736&lang=1&reg=3' },
    portal: { label: 'Open crop insurance portal', url: 'https://pmfby.gov.in/' },
  },
  {
    id: 'soil-health-card', name: 'Soil Health Card Scheme', provider: 'Agriculture department / soil-testing laboratories', categories: ['schemes'],
    summary: 'A soil-testing report describing the nutrient status of a sampled holding.', benefit: 'The card reports twelve soil parameters, including nutrients, pH, electrical conductivity and organic carbon.',
    audience: 'Farmers seeking measured soil-test information through local programme arrangements.',
    prepare: ['Ask the local agriculture office or laboratory about sampling, availability, charges and report collection.'],
    caution: 'A GPS pin or mapped soil class is not a laboratory test. Enter your actual report in the Soil notebook; AgriRakshak does not prescribe fertilizer doses.',
    availability: 'Confirm testing arrangements locally; free testing is not promised here.', checked_on,
    source: { label: 'Official Soil Health Card FAQ', url: 'https://soilhealth.dac.gov.in/files/FAQ_Final_English.pdf' },
    portal: { label: 'Open Soil Health Card portal', url: 'https://soilhealth.dac.gov.in/' },
  },
  {
    id: 'aif', name: 'Agriculture Infrastructure Fund (AIF)', provider: 'Department of Agriculture & Farmers Welfare / lenders', categories: ['schemes', 'loans'],
    summary: 'Financing support for eligible post-harvest and community farming infrastructure.', benefit: '3% annual interest subvention on eligible loans up to ₹2 crore, for up to seven years.',
    audience: 'Applicants with qualifying infrastructure projects; the lender and programme assess eligibility.',
    prepare: ['Check the eligible-project list and ask about the project report, financing plan and lender documentation.'],
    caution: 'The ₹1 lakh crore programme is an aggregate financing facility, not an individual farmer grant. Approval, guarantees and lending terms are conditional.',
    availability: 'Confirm current application and lender requirements.', checked_on,
    source: { label: 'PIB: AIF, 21 March 2025', url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2113716&lang=1&reg=3' },
    portal: { label: 'Open AIF portal', url: 'https://agriinfra.dac.gov.in/' },
  },
  {
    id: 'agricultural-term-loan', name: 'Agricultural term loans', provider: 'Participating banks · SBI example', categories: ['loans'],
    summary: 'Project finance for farm assets such as irrigation equipment and water-storage works.', benefit: 'Amount, margin, security, interest and repayment vary by project and lender.',
    audience: 'Eligible farmers and farmer organisations under the lender’s product rules.',
    prepare: ['Prepare a project/cost proposal and ask the lender for its application and proof-of-cultivation requirements.'],
    caution: 'SBI’s minor-irrigation product is one example. A generic amount or interest range is not a universal loan term.',
    availability: 'Obtain a current written quotation from your bank.', checked_on,
    source: { label: 'SBI: composite minor irrigation', url: 'https://sbi.bank.in/web/agri-rural/agriculture-banking/farm-mechanization-loan/drip-irrigation' },
    portal: { label: 'Read the bank product', url: 'https://sbi.bank.in/web/agri-rural/agriculture-banking/farm-mechanization-loan/drip-irrigation' },
  },
  {
    id: 'warehouse-receipt', name: 'Warehouse receipt / produce marketing loans', provider: 'Participating banks · SBI example', categories: ['loans'],
    summary: 'Credit secured against qualifying agricultural produce held in a warehouse.', benefit: 'The assessed commodity value, receipt type and bank margin determine finance.',
    audience: 'Eligible farmers or groups with acceptable produce and warehouse receipts.',
    prepare: ['Ask the bank about accepted e-NWR/warehouse receipts, identity/address proof, land records and security requirements.'],
    caution: 'Loan limits, margins, storage costs and repayment depend on the lender and commodity. A fixed 70% advance or 6–8% rate is not promised.',
    availability: 'Confirm your warehouse, commodity and receipt are accepted.', checked_on,
    source: { label: 'SBI: produce marketing loan', url: 'https://sbi.bank.in/web/agri-rural/agriculture-banking/miscellaneous-activities/produce-marketing-loan' },
    portal: { label: 'Read the bank product', url: 'https://sbi.bank.in/web/agri-rural/agriculture-banking/miscellaneous-activities/produce-marketing-loan' },
  },
  {
    id: 'pm-kusum', name: 'PM-KUSUM / solar pump finance', provider: 'MNRE / state implementing agencies / lenders', categories: ['schemes', 'loans'],
    summary: 'Programme information for solar agricultural pumps and pump solarisation, with component-specific support.', benefit: 'Subsidy and bank finance depend on the component, state allocation and sanctioned project.',
    audience: 'Applicants meeting the relevant component and state implementing-agency requirements.',
    prepare: ['Ask the state implementing agency about current application windows, pump requirements and approved financing.'],
    caution: 'The MNRE page still lists a programme period ending 31 March 2026. Current new-application availability or extension is unverified; do not assume enrolment is open.',
    availability: 'Application window unverified · confirm with the state agency.', checked_on,
    source: { label: 'MNRE: PM-KUSUM and programme period', url: 'https://mnre.gov.in/en/pradhan-mantri-kisan-urja-suraksha-evam-utthaan-mahabhiyaan-pm-kusum/' },
    portal: { label: 'Open MNRE programme information', url: 'https://mnre.gov.in/en/pradhan-mantri-kisan-urja-suraksha-evam-utthaan-mahabhiyaan-pm-kusum/' },
  },
  {
    id: 'rwbcis', name: 'Weather Based Crop Insurance (RWBCIS)', provider: 'Department of Agriculture & Farmers Welfare / notified insurers', categories: ['insurance'],
    summary: 'Insurance whose admissible claims use specified weather indices as a proxy for crop damage.', benefit: 'Payout triggers follow the notified weather station, area and policy term sheet.',
    audience: 'Farmers growing crops covered by the current state/area notification.',
    prepare: ['Check the notified crop, area, reference weather station, deadline and policy term sheet.'],
    caution: 'The app’s weather forecast cannot calculate an insurance claim. Trigger-based cover does not guarantee payment or immediate settlement.',
    availability: 'Local crop/season availability must be confirmed.', checked_on,
    source: { label: 'PIB: RWBCIS, September 2026', url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2304549&lang=1&reg=48' },
    portal: { label: 'Open crop insurance portal', url: 'https://pmfby.gov.in/' },
  },
];

export function findSupport(category: SupportCategory | 'all', query: string): readonly SupportEntry[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return FARMER_SUPPORT.filter(entry => (category === 'all' || entry.categories.includes(category)) && terms.every(term =>
    [entry.name, entry.provider, entry.summary, entry.benefit, entry.audience, ...entry.categories].join(' ').toLowerCase().includes(term)));
}
