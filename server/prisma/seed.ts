import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FlowLedger Seed Data Generation...');

  // Clean existing tables in reverse order of foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 1. Users across roles
  const passwordHash = await bcrypt.hash('password123', 10);

  const usersData = [
    {
      name: 'Sourav Singh',
      email: 'admin@flowledger.io',
      role: 'ADMIN',
      department: 'Executive Leadership',
      phone: '+91 98200 11223',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Priya Sharma',
      email: 'sales@flowledger.io',
      role: 'SALES',
      department: 'Enterprise Sales',
      phone: '+91 98200 44556',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rahul Verma',
      email: 'sales2@flowledger.io',
      role: 'SALES',
      department: 'North Region Accounts',
      phone: '+91 98111 66778',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Arun Kumar Patel',
      email: 'warehouse@flowledger.io',
      role: 'WAREHOUSE',
      department: 'Supply Chain & Fulfillment',
      phone: '+91 98980 22334',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Ananya Sen',
      email: 'accounts@flowledger.io',
      role: 'ACCOUNTS',
      department: 'Financial Auditing & Billing',
      phone: '+91 98330 77889',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        department: u.department,
        phone: u.phone,
        avatar: u.avatar,
      },
    });
    createdUsers[u.email] = user;
  }
  console.log(`✅ Created ${Object.keys(createdUsers).length} Role-based Users.`);

  // 2. Categories
  const categoriesData = [
    { name: 'Industrial Hardware & Fasteners', code: 'IND-HDW', description: 'Heavy duty bolts, anchors, bearings, nuts and tensile studs.' },
    { name: 'Electrical & Automation Components', code: 'ELEC-AUT', description: 'PLCs, switchgear, MCBs, contactors, relays and control wiring.' },
    { name: 'Precision Mechanical Tools', code: 'PREC-TOOL', description: 'Calipers, micrometers, torque wrenches, drill bits, and pneumatic tools.' },
    { name: 'Packaging & Shipping Materials', code: 'PKG-MAT', description: 'Corrugated boxes, heavy duty strapping, bubble rolls, stretch film.' },
    { name: 'Raw Metals & Alloy Rods', code: 'RAW-MTL', description: 'Stainless steel 316 rods, brass bars, aluminum extrusion profiles.' },
  ];

  const createdCategories: any[] = [];
  for (const cat of categoriesData) {
    const c = await prisma.category.create({ data: cat });
    createdCategories.push(c);
  }
  console.log(`✅ Created ${createdCategories.length} Categories.`);

  // 3. Warehouses
  const warehousesData = [
    {
      name: 'Bhiwandi Logistics Superhub',
      code: 'WH-BHW-01',
      address: 'Survey 142/3, Mankoli Anjur Road, Bhiwandi',
      city: 'Thane / Mumbai',
      state: 'Maharashtra',
      pincode: '421302',
      contactPerson: 'Arun Kumar Patel',
      contactPhone: '+91 98980 22334',
      capacity: 50000,
    },
    {
      name: 'Okhla Phase III Distribution Center',
      code: 'WH-DLH-02',
      address: 'B-24, Okhla Industrial Area Phase III',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110020',
      contactPerson: 'Suresh Singhania',
      contactPhone: '+91 98101 99221',
      capacity: 35000,
    },
    {
      name: 'Sriperumbudur Logistics Park',
      code: 'WH-CHN-03',
      address: 'SIPCOT Industrial Park, Sriperumbudur Highway',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '602105',
      contactPerson: 'Karthik Ramanathan',
      contactPhone: '+91 94440 18822',
      capacity: 40000,
    },
    {
      name: 'Peenya Industrial Depot',
      code: 'WH-BLR-04',
      address: '4th Phase, Peenya Industrial Area',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560058',
      contactPerson: 'Venkatesh Murthy',
      contactPhone: '+91 98450 33112',
      capacity: 30000,
    },
  ];

  const createdWarehouses: any[] = [];
  for (const wh of warehousesData) {
    const w = await prisma.warehouse.create({ data: wh });
    createdWarehouses.push(w);
  }
  console.log(`✅ Created ${createdWarehouses.length} Warehouses.`);

  // 4. Customers (32 realistic B2B customers)
  const customersData = [
    {
      name: 'Rajesh Agrawal',
      businessName: 'Bharat Heavy Equipments Pvt Ltd',
      mobile: '+91 98201 45678',
      email: 'procurement@bharatheavy.com',
      gstNumber: '27AABCB1234F1Z5',
      customerType: 'WHOLESALE',
      address: 'Plot 45, MIDC Industrial Area, Turbhe',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pincode: '400705',
      status: 'ACTIVE',
      notes: 'Key client for fasteners and alloy rods. High volume orders on net 30 terms.',
    },
    {
      name: 'Sunil Kulkarni',
      businessName: 'Apex Precision Engineers Ltd',
      mobile: '+91 98220 89123',
      email: 'stores@apexprecision.in',
      gstNumber: '27AAACA9876E1Z1',
      customerType: 'DISTRIBUTOR',
      address: 'Gat No 312, Chakan Industrial Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '410501',
      status: 'ACTIVE',
      notes: 'Supplies automotive tier-1 vendors. Quarterly bulk deliveries.',
    },
    {
      name: 'Mehul Mehta',
      businessName: 'Kirloskar Electric Spares Depot',
      mobile: '+91 98250 33441',
      email: 'mmehta@kirloskarelectricspares.com',
      gstNumber: '24AABCK5544B1ZV',
      customerType: 'DISTRIBUTOR',
      address: 'Shop 14, GIDC Electronic Estate',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382024',
      status: 'ACTIVE',
      notes: 'Authorized regional stockist for switchgears and relays.',
    },
    {
      name: 'Tarun Saxena',
      businessName: 'Tata Motors Vendor Allied Works',
      mobile: '+91 98112 34567',
      email: 'vendor.allied@tatamotor-supplier.com',
      gstNumber: '07AAACT4433A1Z8',
      customerType: 'WHOLESALE',
      address: 'Block C, Naraina Industrial Area Phase 1',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110028',
      status: 'ACTIVE',
      notes: 'Requires dispatch proof challan within 24 hours of dispatch.',
    },
    {
      name: 'Deepak Godrej',
      businessName: 'Godrej Precision Tooling Solutions',
      mobile: '+91 98205 67890',
      email: 'purchase@godrejtooling.com',
      gstNumber: '27AABCG6677C1ZX',
      customerType: 'WHOLESALE',
      address: 'Pirojshanagar, Eastern Express Highway, Vikhroli',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400079',
      status: 'ACTIVE',
      notes: 'Regular purchaser of micrometers, torque wrenches, and pneumatic tools.',
    },
    {
      name: 'Balaji Soundararajan',
      businessName: 'Crompton Industrial Supplies',
      mobile: '+91 94441 55667',
      email: 'procure@cromptonindustrial.com',
      gstNumber: '33AABCC7788D1Z3',
      customerType: 'DISTRIBUTOR',
      address: 'Guindy Industrial Estate, SIDCO Block 8',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600032',
      status: 'ACTIVE',
      notes: 'Southern distribution hub. Orders full truck loads.',
    },
    {
      name: 'Anand Rathi',
      businessName: 'L&T Electrical Solutions Agency',
      mobile: '+91 98451 22334',
      email: 'anand.rathi@lntelectricalagency.com',
      gstNumber: '29AAACL8899K1Z4',
      customerType: 'WHOLESALE',
      address: 'Plot 18, Peenya 2nd Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560058',
      status: 'ACTIVE',
      notes: 'Electrical switchboards and industrial cables contractor.',
    },
    {
      name: 'Hiren Patel',
      businessName: 'Reliance Retail Wholesale Depot',
      mobile: '+91 98790 12345',
      email: 'b2b.reliance@reliancedepot.com',
      gstNumber: '24AAACR1122D1ZM',
      customerType: 'WHOLESALE',
      address: 'Sarkhej Bavla Highway, Changodar',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382213',
      status: 'ACTIVE',
      notes: 'Packaging and corrugated material supplier contracts.',
    },
    {
      name: 'Siddharth Birla',
      businessName: 'Aditya Birla Logistics & Allied Supplies',
      mobile: '+91 98310 99887',
      email: 'birlasupplies@adityabirlalogistics.com',
      gstNumber: '19AABCA3322N1ZU',
      customerType: 'WHOLESALE',
      address: 'Camac Street, Industry House 4th Floor',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700017',
      status: 'ACTIVE',
      notes: 'East zone central supplier for industrial strapping and metals.',
    },
    {
      name: 'Vikas Bansal',
      businessName: 'Havells Authorized Electrical Hub',
      mobile: '+91 98103 44556',
      email: 'bansal.havells@havellshub.in',
      gstNumber: '06AABCH9911F1Z9',
      customerType: 'DISTRIBUTOR',
      address: 'Sector 25, Industrial Area',
      city: 'Faridabad',
      state: 'Haryana',
      pincode: '121004',
      status: 'ACTIVE',
      notes: 'High demand for high voltage contactors and cable trays.',
    },
    {
      name: 'Manoj Tiwari',
      businessName: 'Microtek Power Solutions Spares',
      mobile: '+91 98180 33221',
      email: 'manoj@microtekspares.com',
      gstNumber: '07AAACM6655L1Z0',
      customerType: 'WHOLESALE',
      address: 'Phase 2, Badli Industrial Area',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110042',
      status: 'ACTIVE',
      notes: 'Power backup units and industrial battery terminal connectors.',
    },
    {
      name: 'Chandresh Shah',
      businessName: 'Finolex Pipes & Fittings Agency',
      mobile: '+91 98240 77665',
      email: 'cshah@finolexagency.in',
      gstNumber: '24AABCF2211H1ZP',
      customerType: 'DISTRIBUTOR',
      address: 'Makarpura GIDC Industrial Estate',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '390010',
      status: 'ACTIVE',
      notes: 'Deals in high tensile fasteners and hydraulic seals.',
    },
    {
      name: 'Dinesh Daga',
      businessName: 'Polycab Industrial Wires Direct',
      mobile: '+91 98290 88776',
      email: 'procurement@polycabwiresdirect.com',
      gstNumber: '08AAACP4411J1ZX',
      customerType: 'DISTRIBUTOR',
      address: 'VKIA Road No 9, Vishwakarma Industrial Area',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302013',
      status: 'ACTIVE',
      notes: 'Rajasthan state channel partner.',
    },
    {
      name: 'Gaurav Singhal',
      businessName: 'Supreme Petrochem Wholesale Link',
      mobile: '+91 98140 12890',
      email: 'gsinghal@supremelink.com',
      gstNumber: '03AAACS8877P1ZT',
      customerType: 'WHOLESALE',
      address: 'Focal Point Phase 5',
      city: 'Ludhiana',
      state: 'Punjab',
      pincode: '141010',
      status: 'ACTIVE',
      notes: 'Supplies polymer packaging and stretch films.',
    },
    {
      name: 'Naveen Reddy',
      businessName: 'Voltas HVAC Spares Network',
      mobile: '+91 98480 34123',
      email: 'nreddy@voltashvacspares.com',
      gstNumber: '36AAACV1298K1ZB',
      customerType: 'WHOLESALE',
      address: 'Balanagar Industrial Area',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500037',
      status: 'ACTIVE',
      notes: 'Cooling tower spare parts, brass valves, and copper pipe fittings.',
    },
    {
      name: 'Rohan Deshmukh',
      businessName: 'Mahindra Heavy Auto Components',
      mobile: '+91 98230 77112',
      email: 'stores.mha@mahindrasuppliers.in',
      gstNumber: '27AAACM4455Q1ZE',
      customerType: 'WHOLESALE',
      address: 'MIDC Ambad Industrial Area',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422010',
      status: 'ACTIVE',
      notes: 'Heavy automotive fasteners, precision pins, and flange bolts.',
    },
    {
      name: 'Swaminathan Iyer',
      businessName: 'TVS Motors Vendor Auxiliary',
      mobile: '+91 94430 99882',
      email: 'vendor.aux@tvsmotorallied.com',
      gstNumber: '33AAACT1199R1ZQ',
      customerType: 'WHOLESALE',
      address: 'Hosur Industrial Complex Phase 1',
      city: 'Hosur',
      state: 'Tamil Nadu',
      pincode: '635126',
      status: 'ACTIVE',
      notes: 'Monthly bulk demand for torque wrenches and stainless steel fasteners.',
    },
    {
      name: 'Amitabh Joshi',
      businessName: 'Thermax Boiler Accessories Depot',
      mobile: '+91 98221 66554',
      email: 'ajoshi@thermaxaccessories.com',
      gstNumber: '27AABCT8844D1Z2',
      customerType: 'DISTRIBUTOR',
      address: 'Bhosari Industrial Estate, PCMC',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411026',
      status: 'ACTIVE',
      notes: 'High temperature gasket materials and alloy rods.',
    },
    {
      name: 'Nitin Garg',
      businessName: 'Jindal Steel Fabrication Depot',
      mobile: '+91 98120 44332',
      email: 'purchase@jindalfabrications.in',
      gstNumber: '06AAACJ9933B1ZR',
      customerType: 'WHOLESALE',
      address: 'Delhi-Rohtak Road, Bahadurgarh',
      city: 'Jhajjar',
      state: 'Haryana',
      pincode: '124507',
      status: 'ACTIVE',
      notes: 'Heavy structural studs and raw alloy bars.',
    },
    {
      name: 'Pradeep Chawla',
      businessName: 'BHEL Spares Distribution Unit',
      mobile: '+91 98260 55112',
      email: 'pchawla@bhelspares.co.in',
      gstNumber: '23AABCB7722M1ZH',
      customerType: 'WHOLESALE',
      address: 'Govindpura Industrial Estate',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462023',
      status: 'ACTIVE',
      notes: 'Turbine fasteners and high precision calipers.',
    },
    // Leads / Inactive for CRM diversity
    {
      name: 'Suresh Raina',
      businessName: 'Kanpur Tannery Machine Works',
      mobile: '+91 94150 22331',
      email: 'suresh@kanpurtannery.in',
      gstNumber: '09AAACK3311E1ZS',
      customerType: 'RETAIL',
      address: 'Jajmau Industrial Area',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      pincode: '208010',
      status: 'LEAD',
      notes: 'Inquired for packaging rolls and conveyor fasteners. Follow-up scheduled.',
    },
    {
      name: 'Harish Nair',
      businessName: 'Cochin Marine Tooling Depot',
      mobile: '+91 94470 88990',
      email: 'harish@cochinmarine.com',
      gstNumber: '32AAACH4422L1ZW',
      customerType: 'DISTRIBUTOR',
      address: 'Willingdon Island Port Area',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682003',
      status: 'LEAD',
      notes: 'Requested product catalog and wholesale distributor price list.',
    },
    {
      name: 'Pooja Agarwal',
      businessName: 'Jaipur Precision Solar Fasteners',
      mobile: '+91 98280 44991',
      email: 'pooja@jaipursolar.in',
      gstNumber: '08AAACJ7711K1ZX',
      customerType: 'WHOLESALE',
      address: 'Sitapura Industrial Area Phase 3',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302022',
      status: 'LEAD',
      notes: 'Solar mounting clamp fasteners. Quotation sent.',
    },
    {
      name: 'Rameshwar Roy',
      businessName: 'Bokaro Mechanical Spares',
      mobile: '+91 94310 66778',
      email: 'rroy@bokarospares.com',
      gstNumber: '20AAACB1188D1ZG',
      customerType: 'RETAIL',
      address: 'Sector 4 Industrial Zone',
      city: 'Bokaro',
      state: 'Jharkhand',
      pincode: '827004',
      status: 'LEAD',
      notes: 'Steel plant maintenance spares. Waiting for vendor registration.',
    },
    {
      name: 'Alok Bhattacharya',
      businessName: 'Durgapur Allied Foundry Works',
      mobile: '+91 94340 77114',
      email: 'alok@durgapurallied.co.in',
      gstNumber: '19AAACD5544R1ZM',
      customerType: 'WHOLESALE',
      address: 'Industrial Township, City Center',
      city: 'Durgapur',
      state: 'West Bengal',
      pincode: '713216',
      status: 'INACTIVE',
      notes: 'No orders placed in last 6 months. Account manager review required.',
    },
    {
      name: 'Prakash Rao',
      businessName: 'Visakhapatnam Shipyard Spares',
      mobile: '+91 98490 22119',
      email: 'prao@vizagshipyardspares.com',
      gstNumber: '37AAACV8899M1ZT',
      customerType: 'WHOLESALE',
      address: 'Gajuwaka Industrial Corridor',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530026',
      status: 'ACTIVE',
      notes: 'High grade SS316 marine bolts and nuts.',
    },
    {
      name: 'Ketan Trivedi',
      businessName: 'Surat Textile Machinery Hardware',
      mobile: '+91 98251 99002',
      email: 'ktrivedi@surattextilemachinery.in',
      gstNumber: '24AAACS3344Q1ZL',
      customerType: 'DISTRIBUTOR',
      address: 'Pandesara GIDC Industrial Estate',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '394221',
      status: 'ACTIVE',
      notes: 'Need regular supply of high tensile machine screws.',
    },
    {
      name: 'Neeraj Gupta',
      businessName: 'Noida Smart Automation Solutions',
      mobile: '+91 98110 55441',
      email: 'neeraj@noidaautomation.com',
      gstNumber: '09AAACN8833E1ZK',
      customerType: 'DISTRIBUTOR',
      address: 'Sector 63 Electronic City',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      status: 'ACTIVE',
      notes: 'PLC panels and programmable relay modules.',
    },
    {
      name: 'Satish Kamat',
      businessName: 'Goa Coastal Engineering Works',
      mobile: '+91 98221 44559',
      email: 'skamat@goacoastal.com',
      gstNumber: '30AAACG9922P1ZA',
      customerType: 'RETAIL',
      address: 'Verna Industrial Estate Phase 2',
      city: 'Verna',
      state: 'Goa',
      pincode: '403722',
      status: 'ACTIVE',
      notes: 'Marine anti-corrosive fasteners.',
    },
    {
      name: 'Bhavin Patel',
      businessName: 'Morbi Ceramic Tile Machinery Depot',
      mobile: '+91 98252 66334',
      email: 'bhavin@morbiceramicspares.com',
      gstNumber: '24AAACM1133F1Z6',
      customerType: 'WHOLESALE',
      address: 'National Highway 8A, Trajpar',
      city: 'Morbi',
      state: 'Gujarat',
      pincode: '363642',
      status: 'ACTIVE',
      notes: 'Continuous packaging rolls and heavy conveyor roller bearings.',
    },
    {
      name: 'Gurpreet Singh',
      businessName: 'Amritsar Agro Equipment Spares',
      mobile: '+91 98150 99443',
      email: 'gsingh@amritsaragro.in',
      gstNumber: '03AAACA4488D1Z7',
      customerType: 'DISTRIBUTOR',
      address: 'GT Road Industrial Area',
      city: 'Amritsar',
      state: 'Punjab',
      pincode: '143001',
      status: 'ACTIVE',
      notes: 'Tractor linkages and high shear pins.',
    },
    {
      name: 'Tarun Goswami',
      businessName: 'Guwahati Power & Tea Spares',
      mobile: '+91 94350 11228',
      email: 'tarun@guwahatiteaspares.com',
      gstNumber: '18AAACG6699N1ZV',
      customerType: 'WHOLESALE',
      address: 'Bamunimaidam Industrial Estate',
      city: 'Guwahati',
      state: 'Assam',
      pincode: '781021',
      status: 'ACTIVE',
      notes: 'Tea processing machinery maintenance and heavy electric motors.',
    },
  ];

  const createdCustomers: any[] = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({ data: c });
    createdCustomers.push(customer);
  }
  console.log(`✅ Created ${createdCustomers.length} Customers.`);

  // 5. Products (52 diverse, realistic wholesale products with varied health levels)
  const productsRaw = [
    // Category 0: Industrial Hardware (IND-HDW)
    { name: 'SS 316 Hex Bolt M12 x 50mm (Grade 8.8)', sku: 'SKU-HDW-1001', catIdx: 0, price: 45.0, stock: 2400, minStock: 300, unit: 'PCS', whIdx: 0, desc: 'High tensile marine grade stainless steel hex head fastener.' },
    { name: 'High Tensile Anchor Fastener M16 x 150mm', sku: 'SKU-HDW-1002', catIdx: 0, price: 120.0, stock: 850, minStock: 200, unit: 'PCS', whIdx: 0, desc: 'Heavy duty concrete anchor expansion bolt.' },
    { name: 'Self Drilling Flange Screw 4.2 x 25mm (Box of 500)', sku: 'SKU-HDW-1003', catIdx: 0, price: 680.0, stock: 120, minStock: 40, unit: 'BOX', whIdx: 0, desc: 'Zinc coated self-drilling metal sheet screw.' },
    { name: 'Deep Groove Ball Bearing 6205-2RS', sku: 'SKU-HDW-1004', catIdx: 0, price: 285.0, stock: 420, minStock: 100, unit: 'PCS', whIdx: 0, desc: 'Rubber sealed high speed precision industrial bearing.' },
    { name: 'Taper Roller Bearing 30207', sku: 'SKU-HDW-1005', catIdx: 0, price: 640.0, stock: 180, minStock: 50, unit: 'PCS', whIdx: 1, desc: 'Heavy load carrying automotive and industrial bearing.' },
    { name: 'Nylon Lock Nut M10 (Pack of 100)', sku: 'SKU-HDW-1006', catIdx: 0, price: 175.0, stock: 350, minStock: 80, unit: 'BOX', whIdx: 1, desc: 'Vibration resistant nylon insert self locking nuts.' },
    { name: 'Stainless Steel Spring Washer M8 (Box of 1000)', sku: 'SKU-HDW-1007', catIdx: 0, price: 420.0, stock: 95, minStock: 30, unit: 'BOX', whIdx: 2, desc: 'DIN 127B spring lock washers.' },
    { name: 'Industrial Flange Gasket Spiral Wound 2" 150#', sku: 'SKU-HDW-1008', catIdx: 0, price: 340.0, stock: 15, minStock: 25, unit: 'PCS', whIdx: 2, desc: 'High pressure graphite filled spiral wound pipe gasket.' }, // LOW STOCK
    { name: 'Heavy Duty U-Bolt with Nuts 4" Pipe Size', sku: 'SKU-HDW-1009', catIdx: 0, price: 210.0, stock: 8, minStock: 30, unit: 'PCS', whIdx: 3, desc: 'Galvanized pipe clamping bolt with twin hex nuts.' }, // CRITICAL STOCK
    { name: 'Hardened Dowel Pin 8mm x 40mm (Pack of 50)', sku: 'SKU-HDW-1010', catIdx: 0, price: 380.0, stock: 0, minStock: 20, unit: 'BOX', whIdx: 3, desc: 'Ground alloy steel precision alignment pin.' }, // OUT OF STOCK

    // Category 1: Electrical & Automation (ELEC-AUT)
    { name: 'Schneider Acti9 3-Pole MCB 32A C-Curve', sku: 'SKU-ELC-2001', catIdx: 1, price: 1450.0, stock: 180, minStock: 30, unit: 'PCS', whIdx: 0, desc: '10kA breaking capacity miniature circuit breaker.' },
    { name: 'Siemens 3TF30 Power Contactor 3P 9A 230V AC', sku: 'SKU-ELC-2002', catIdx: 1, price: 1120.0, stock: 95, minStock: 20, unit: 'PCS', whIdx: 0, desc: 'AC-3 duty motor control contactor.' },
    { name: 'Omron Industrial Relay 24VDC 8-Pin with Base', sku: 'SKU-ELC-2003', catIdx: 1, price: 460.0, stock: 320, minStock: 50, unit: 'PCS', whIdx: 1, desc: 'DPDT plug-in control relay with LED status indicator.' },
    { name: 'Delta Programmable Logic Controller (PLC) DVP-14SS2', sku: 'SKU-ELC-2004', catIdx: 1, price: 7850.0, stock: 24, minStock: 10, unit: 'PCS', whIdx: 1, desc: '14-point compact micro PLC with RS-485 Modbus.' },
    { name: 'L&T Moulded Case Circuit Breaker (MCCB) 100A 4P', sku: 'SKU-ELC-2005', catIdx: 1, price: 8400.0, stock: 45, minStock: 15, unit: 'PCS', whIdx: 2, desc: '25kA thermal magnetic industrial MCCB.' },
    { name: 'Polycab 4-Core Flexible Copper Cable 2.5 sq mm (100m)', sku: 'SKU-ELC-2006', catIdx: 1, price: 5800.0, stock: 110, minStock: 25, unit: 'BOX', whIdx: 2, desc: 'FR PVC insulated industrial multi-strand wiring.' },
    { name: 'Phoenix Contact Terminal Block Din Rail 4mm (Pack of 50)', sku: 'SKU-ELC-2007', catIdx: 1, price: 1250.0, stock: 140, minStock: 30, unit: 'BOX', whIdx: 3, desc: 'Screw clamp feed-through modular terminal block.' },
    { name: 'Selec Digital Multi-Function Power Meter MFM384', sku: 'SKU-ELC-2008', catIdx: 1, price: 3450.0, stock: 6, minStock: 15, unit: 'PCS', whIdx: 3, desc: '3-phase voltage, current, power and energy analyzer.' }, // CRITICAL STOCK
    { name: 'Mean Well Din Rail SMPS 24V DC 5A 120W', sku: 'SKU-ELC-2009', catIdx: 1, price: 2150.0, stock: 12, minStock: 20, unit: 'PCS', whIdx: 0, desc: 'Industrial switching power supply with overload protection.' }, // LOW STOCK
    { name: 'Pepperl+Fuchs Inductive Proximity Sensor NPN NO 8mm', sku: 'SKU-ELC-2010', catIdx: 1, price: 1850.0, stock: 0, minStock: 15, unit: 'PCS', whIdx: 1, desc: 'M18 cylindrical non-contact metal detection sensor.' }, // OUT OF STOCK

    // Category 2: Precision Mechanical Tools (PREC-TOOL)
    { name: 'Mitutoyo Digital Vernier Caliper 0-150mm / 0.01mm', sku: 'SKU-TOL-3001', catIdx: 2, price: 7400.0, stock: 65, minStock: 15, unit: 'PCS', whIdx: 0, desc: 'Japanese absolute digimatic caliper with carbide jaws.' },
    { name: 'Insize Outside Micrometer 0-25mm (0.001mm accuracy)', sku: 'SKU-TOL-3002', catIdx: 2, price: 2850.0, stock: 80, minStock: 20, unit: 'PCS', whIdx: 0, desc: 'Ratchet thimble standard external micrometer.' },
    { name: 'Britool 1/2" Drive Click Type Torque Wrench (40-200 Nm)', sku: 'SKU-TOL-3003', catIdx: 2, price: 6200.0, stock: 35, minStock: 10, unit: 'PCS', whIdx: 1, desc: 'Calibrated dual-scale precision torque wrench.' },
    { name: 'Taparia Heavy Duty 1/2" Socket Set (24 Pieces)', sku: 'SKU-TOL-3004', catIdx: 2, price: 3950.0, stock: 75, minStock: 20, unit: 'SET', whIdx: 1, desc: 'Chrome vanadium alloy steel master mechanics kit.' },
    { name: 'Bosch Professional Rotary Hammer Drill 800W GBH 2-26', sku: 'SKU-TOL-3005', catIdx: 2, price: 8200.0, stock: 28, minStock: 8, unit: 'PCS', whIdx: 2, desc: 'SDS-plus heavy concrete masonry hammer drill.' },
    { name: 'HSS-Co5 Cobalt Drill Bit Set 1mm - 13mm (25 Pcs)', sku: 'SKU-TOL-3006', catIdx: 2, price: 3100.0, stock: 90, minStock: 25, unit: 'SET', whIdx: 2, desc: 'Heavy stainless steel drilling cobalt coated bits.' },
    { name: 'Pneumatic 1/2" Air Impact Wrench 680 Nm', sku: 'SKU-TOL-3007', catIdx: 2, price: 5400.0, stock: 40, minStock: 12, unit: 'PCS', whIdx: 3, desc: 'Twin hammer pneumatic garage and assembly wrench.' },
    { name: 'Dial Indicator Gauge 0-10mm / 0.01mm Lug Back', sku: 'SKU-TOL-3008', catIdx: 2, price: 1650.0, stock: 7, minStock: 15, unit: 'PCS', whIdx: 3, desc: 'Precision runout measurement dial gauge.' }, // CRITICAL
    { name: 'Machinist Precision Magnetic Base Stand 60kg Pull', sku: 'SKU-TOL-3009', catIdx: 2, price: 1350.0, stock: 14, minStock: 20, unit: 'PCS', whIdx: 0, desc: 'On/off switchable heavy magnetic dial stand.' }, // LOW STOCK
    { name: 'Bipico Bi-Metal Holesaw Master Electrician Set (11 Pcs)', sku: 'SKU-TOL-3010', catIdx: 2, price: 4200.0, stock: 0, minStock: 10, unit: 'SET', whIdx: 1, desc: 'Heavy duty sheet metal cutting variable pitch holesaws.' }, // OUT OF STOCK

    // Category 3: Packaging & Shipping Materials (PKG-MAT)
    { name: '3-Ply Heavy Corrugated Boxes 18x12x10" (Bundle of 25)', sku: 'SKU-PKG-4001', catIdx: 3, price: 850.0, stock: 450, minStock: 100, unit: 'BOX', whIdx: 0, desc: 'High bursting strength kraft paper shipping boxes.' },
    { name: 'Industrial Stretch Film Roll 500mm x 23 Micron (3kg)', sku: 'SKU-PKG-4002', catIdx: 3, price: 520.0, stock: 680, minStock: 150, unit: 'PCS', whIdx: 0, desc: 'High elongation pallet wrap protective stretch film.' },
    { name: 'Heavy Duty PET Poly Strapping 16mm x 0.8mm (Roll of 1500m)', sku: 'SKU-PKG-4003', catIdx: 3, price: 2950.0, stock: 120, minStock: 30, unit: 'PCS', whIdx: 1, desc: 'Green embossed polyester high break strength strap.' },
    { name: 'Air Bubble Roll 1m x 100m Double Layer 60 GSM', sku: 'SKU-PKG-4004', catIdx: 3, price: 1150.0, stock: 210, minStock: 50, unit: 'PCS', whIdx: 1, desc: 'Shock absorbing protective cushioning roll.' },
    { name: 'Brown BoPP Packaging Tape 48mm x 65m (Box of 72 Rolls)', sku: 'SKU-PKG-4005', catIdx: 3, price: 1850.0, stock: 140, minStock: 40, unit: 'BOX', whIdx: 2, desc: 'High adhesion carton sealing pressure sensitive tape.' },
    { name: 'Manual Hand Pallet Strapping Tensioner & Sealer Tool Set', sku: 'SKU-PKG-4006', catIdx: 3, price: 2400.0, stock: 55, minStock: 15, unit: 'SET', whIdx: 2, desc: 'Heavy alloy steel packaging tensioner and crimper combo.' },
    { name: 'EPE Foam Sheet Roll 2mm x 1m x 100m', sku: 'SKU-PKG-4007', catIdx: 3, price: 1450.0, stock: 85, minStock: 25, unit: 'PCS', whIdx: 3, desc: 'Scratch prevention expanded polyethylene padding.' },
    { name: 'Silica Gel Moisture Absorber Pouches 5g (Pack of 500)', sku: 'SKU-PKG-4008', catIdx: 3, price: 650.0, stock: 18, minStock: 35, unit: 'BOX', whIdx: 3, desc: 'Desiccant pouches for moisture protection in transit.' }, // LOW STOCK
    { name: 'Corrugated Edge Corner Protectors 50x50x1000mm (Pack of 50)', sku: 'SKU-PKG-4009', catIdx: 3, price: 920.0, stock: 5, minStock: 20, unit: 'BOX', whIdx: 0, desc: 'Heavy solid board pallet edge protection angles.' }, // CRITICAL
    { name: 'Security Tamper Evident Void Tape 50mm x 50m (Box of 24)', sku: 'SKU-PKG-4010', catIdx: 3, price: 3400.0, stock: 0, minStock: 10, unit: 'BOX', whIdx: 1, desc: 'Self-adhesive red warranty void tamper evident tape.' }, // OUT OF STOCK

    // Category 4: Raw Metals & Alloy Rods (RAW-MTL)
    { name: 'SS 316L Round Bar Diameter 25mm x 1 Meter', sku: 'SKU-MTL-5001', catIdx: 4, price: 1850.0, stock: 240, minStock: 50, unit: 'PCS', whIdx: 0, desc: 'Chemical resistant bright drawn austenitic stainless bar.' },
    { name: 'Brass Hex Rod Grade CuZn39Pb3 19mm A/F (2 Meters)', sku: 'SKU-MTL-5002', catIdx: 4, price: 2900.0, stock: 160, minStock: 40, unit: 'PCS', whIdx: 0, desc: 'Free cutting high machinability brass rod.' },
    { name: 'Aluminum Extrusion Profile 40x40 T-Slot (3 Meters)', sku: 'SKU-MTL-5003', catIdx: 4, price: 1750.0, stock: 190, minStock: 45, unit: 'PCS', whIdx: 1, desc: '6063-T5 anodized modular industrial framework profile.' },
    { name: 'EN8 / C45 Carbon Steel Round Shaft 50mm x 1 Meter', sku: 'SKU-MTL-5004', catIdx: 4, price: 2150.0, stock: 110, minStock: 30, unit: 'PCS', whIdx: 1, desc: 'Medium carbon steel unalloyed engineering shaft.' },
    { name: 'Phosphor Bronze Bushing Hollow Bar OD 60mm ID 40mm (0.5m)', sku: 'SKU-MTL-5005', catIdx: 4, price: 4600.0, stock: 70, minStock: 20, unit: 'PCS', whIdx: 2, desc: 'Continuous cast bearing grade PB1 bronze hollow bar.' },
    { name: 'Copper Busbar Flat Strip 50mm x 6mm (2 Meters)', sku: 'SKU-MTL-5006', catIdx: 4, price: 4200.0, stock: 85, minStock: 25, unit: 'PCS', whIdx: 2, desc: '99.9% ETP high conductivity electrical busbar.' },
    { name: 'SS 304 Seamless Hydraulic Pipe 12mm OD x 1.5mm Wall (3m)', sku: 'SKU-MTL-5007', catIdx: 4, price: 1350.0, stock: 130, minStock: 35, unit: 'PCS', whIdx: 3, desc: 'Cold drawn annealed instrumentation tubing.' },
    { name: 'Cast Iron Round Bar Grade FG 260 75mm x 1 Meter', sku: 'SKU-MTL-5008', catIdx: 4, price: 3200.0, stock: 10, minStock: 20, unit: 'PCS', whIdx: 3, desc: 'Continuously cast grey iron bar for pulleys and gears.' }, // LOW STOCK
    { name: 'Silver Steel Precision Ground Rod 10mm x 1m (Pack of 5)', sku: 'SKU-MTL-5009', catIdx: 4, price: 2450.0, stock: 4, minStock: 15, unit: 'SET', whIdx: 0, desc: 'BS1407 1% carbon tool steel drill rod.' }, // CRITICAL
    { name: 'Titanium Grade 5 Ti-6Al-4V Round Bar 20mm x 0.5m', sku: 'SKU-MTL-5010', catIdx: 4, price: 9800.0, stock: 0, minStock: 5, unit: 'PCS', whIdx: 1, desc: 'Aerospace and medical grade lightweight high strength titanium.' }, // OUT OF STOCK
    { name: 'Galvanized Steel Binding Wire 16 Gauge (Bundle of 25kg)', sku: 'SKU-MTL-5011', catIdx: 4, price: 2300.0, stock: 95, minStock: 20, unit: 'KG', whIdx: 2, desc: 'Soft annealed electro-galvanized reinforcement tie wire.' },
    { name: 'Alloy Steel EN24 / 817M40 Heavy Round Bar 80mm x 1m', sku: 'SKU-MTL-5012', catIdx: 4, price: 5900.0, stock: 40, minStock: 10, unit: 'PCS', whIdx: 3, desc: 'Nickel chromium molybdenum high tensile shafting steel.' },
  ];

  const createdProducts: any[] = [];
  for (const p of productsRaw) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        categoryId: createdCategories[p.catIdx].id,
        unitPrice: p.price,
        currentStock: p.stock,
        minStockQuantity: p.minStock,
        warehouseId: createdWarehouses[p.whIdx].id,
        unit: p.unit,
        description: p.desc,
        imageUrl: `https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80`,
      },
    });
    createdProducts.push(prod);
  }
  console.log(`✅ Created ${createdProducts.length} Products with Dynamic Inventory Health.`);

  // 6. Follow-ups (Overdue, Today, Upcoming)
  const today = new Date();
  const followUpsData = [
    {
      custIdx: 0,
      assignedEmail: 'sales@flowledger.io',
      reason: 'Quarterly Fastener contract renewal and volume discount finalization.',
      dueDate: new Date(today.getTime() - 3 * 24 * 3600 * 1000), // Overdue 3 days
      priority: 'HIGH',
      status: 'PENDING',
      notes: 'Client requested revised quote for 5,000 SS 316 hex bolts.',
    },
    {
      custIdx: 1,
      assignedEmail: 'sales@flowledger.io',
      reason: 'Automotive tier-1 audit sample delivery confirmation.',
      dueDate: new Date(today.getTime() - 1 * 24 * 3600 * 1000), // Overdue 1 day
      priority: 'HIGH',
      status: 'PENDING',
      notes: 'Need QA certificate from Bhiwandi warehouse before dispatch.',
    },
    {
      custIdx: 3,
      assignedEmail: 'sales2@flowledger.io',
      reason: 'Check receipt of 500m Polycab industrial wiring challan.',
      dueDate: new Date(today.getTime() + 2 * 3600 * 1000), // Today in 2 hours
      priority: 'MEDIUM',
      status: 'PENDING',
      notes: 'Confirm if transporter delivered at Naraina plant.',
    },
    {
      custIdx: 4,
      assignedEmail: 'sales@flowledger.io',
      reason: 'Demo new Mitutoyo Digital Micrometer series at Vikhroli workshop.',
      dueDate: new Date(today.getTime() + 4 * 3600 * 1000), // Today in 4 hours
      priority: 'HIGH',
      status: 'PENDING',
      notes: 'Take 2 samples and calibration test bench kit.',
    },
    {
      custIdx: 5,
      assignedEmail: 'sales2@flowledger.io',
      reason: 'Monthly switchgear bulk order discussion.',
      dueDate: new Date(today.getTime() + 24 * 3600 * 1000), // Tomorrow
      priority: 'MEDIUM',
      status: 'PENDING',
      notes: 'Confirm warehouse allocation at Sriperumbudur.',
    },
    {
      custIdx: 20, // Lead
      assignedEmail: 'sales@flowledger.io',
      reason: 'Follow-up on quotation sent for corrugated packaging rolls.',
      dueDate: new Date(today.getTime() - 2 * 24 * 3600 * 1000), // Overdue 2 days
      priority: 'HIGH',
      status: 'PENDING',
      notes: 'Mr. Suresh requested 15 days credit terms approval from Accounts.',
    },
    {
      custIdx: 21, // Lead
      assignedEmail: 'sales2@flowledger.io',
      reason: 'Send wholesale distributor price list for marine tooling.',
      dueDate: new Date(today.getTime() + 2 * 24 * 3600 * 1000), // Upcoming in 2 days
      priority: 'MEDIUM',
      status: 'PENDING',
      notes: 'Check freight charges for Kochi port delivery.',
    },
    {
      custIdx: 6,
      assignedEmail: 'sales@flowledger.io',
      reason: 'Reconcile outstanding statement for previous fiscal quarter.',
      dueDate: new Date(today.getTime() - 5 * 24 * 3600 * 1000),
      priority: 'LOW',
      status: 'COMPLETED',
      notes: 'Statement sent and acknowledged by finance manager Mr. Anand.',
    },
    {
      custIdx: 7,
      assignedEmail: 'sales2@flowledger.io',
      reason: 'Annual packaging rate contract discussion.',
      dueDate: new Date(today.getTime() + 5 * 24 * 3600 * 1000), // In 5 days
      priority: 'MEDIUM',
      status: 'PENDING',
      notes: 'Prepare comparative index against market pulp rates.',
    },
  ];

  for (const f of followUpsData) {
    await prisma.followUp.create({
      data: {
        customerId: createdCustomers[f.custIdx].id,
        assignedToId: createdUsers[f.assignedEmail].id,
        reason: f.reason,
        dueDate: f.dueDate,
        priority: f.priority,
        status: f.status,
        notes: f.notes,
      },
    });
  }
  console.log(`✅ Created ${followUpsData.length} Follow-ups with Overdue & Today priorities.`);

  // 7. Customer Notes (for Customer 360)
  const notesData = [
    { custIdx: 0, authorEmail: 'sales@flowledger.io', note: 'Customer requires GST invoice and e-way bill with all delivery challans.' },
    { custIdx: 0, authorEmail: 'admin@flowledger.io', note: 'Approved credit limit of ₹15,00,000 based on audited financial review.' },
    { custIdx: 1, authorEmail: 'sales@flowledger.io', note: 'Factory works in two shifts. Dispatches must reach between 8 AM and 4 PM.' },
    { custIdx: 3, authorEmail: 'sales2@flowledger.io', note: 'Special packaging instructions: Plastic wrapping required for all cable reels.' },
    { custIdx: 4, authorEmail: 'sales@flowledger.io', note: 'Contact Mr. Deepak directly on mobile for urgent purchase approvals.' },
    { custIdx: 5, authorEmail: 'accounts@flowledger.io', note: 'Bank NEFT clearance verified for previous billing cycle.' },
  ];

  for (const n of notesData) {
    await prisma.customerNote.create({
      data: {
        customerId: createdCustomers[n.custIdx].id,
        authorId: createdUsers[n.authorEmail].id,
        note: n.note,
      },
    });
  }
  console.log(`✅ Created ${notesData.length} Customer Notes.`);

  // 8. Sales Challans (32 realistic Challans across Draft, Confirmed, Cancelled)
  const challanData = [
    {
      custIdx: 0,
      status: 'CONFIRMED',
      items: [
        { prodIdx: 0, qty: 150 }, // SS 316 Hex Bolt
        { prodIdx: 1, qty: 25 },  // Anchor Fastener
        { prodIdx: 40, qty: 10 }, // SS 316L Round Bar
      ],
      transporter: 'V-Trans Express Logistics',
      vehicle: 'MH-04-GP-8891',
      notes: 'Urgent site delivery at Turbhe workshop. Unloading at Gate 2.',
      dateOffsetDays: -28,
    },
    {
      custIdx: 1,
      status: 'CONFIRMED',
      items: [
        { prodIdx: 3, qty: 50 },  // Bearing 6205
        { prodIdx: 4, qty: 20 },  // Taper Roller Bearing
        { prodIdx: 23, qty: 5 },  // Socket Set
      ],
      transporter: 'Gati KWE Cargo',
      vehicle: 'MH-14-AZ-4421',
      notes: 'Automotive tier-1 line replenishment. Signed acknowledgement mandatory.',
      dateOffsetDays: -24,
    },
    {
      custIdx: 2,
      status: 'CONFIRMED',
      items: [
        { prodIdx: 10, qty: 30 }, // Schneider MCB
        { prodIdx: 11, qty: 20 }, // Siemens Contactor
        { prodIdx: 12, qty: 40 }, // Omron Relay
      ],
      transporter: 'Safechem Express Transport',
      vehicle: 'GJ-01-XX-9012',
      notes: 'Electronics stockist regular shipment.',
      dateOffsetDays: -20,
    },
    {
      custIdx: 3,
      status: 'CONFIRMED',
      items: [
        { prodIdx: 15, qty: 15 }, // Polycab Cable
        { prodIdx: 16, qty: 10 }, // Terminal Blocks
      ],
      transporter: 'Delhi-Gujarat Fleet',
      vehicle: 'DL-1L-AA-3341',
      notes: 'Heavy cable drums secured with strapping.',
      dateOffsetDays: -16,
    },
    {
      custIdx: 4,
      status: 'CONFIRMED',
      items: [
        { prodIdx: 20, qty: 8 },  // Mitutoyo Caliper
        { prodIdx: 21, qty: 12 }, // Outside Micrometer
        { prodIdx: 22, qty: 4 },  // Torque Wrench
      ],
      transporter: 'Bluedart Surface Courier',
      vehicle: 'MH-02-CW-1199',
      notes: 'Fragile precision instrument consignment. Handle with care.',
      dateOffsetDays: -12,
    },
    {
      custIdx: 5,
      status: 'CONFIRMED',
      items: [
        { prodIdx: 10, qty: 25 }, // Schneider MCB
        { prodIdx: 14, qty: 6 },  // L&T MCCB
      ],
      transporter: 'South India Roadways',
      vehicle: 'TN-07-BL-5544',
      notes: 'Heavy switchboards dispatch.',
      dateOffsetDays: -8,
    },
    {
      custIdx: 6,
      status: 'CONFIRMED',
      items: [
        { prodIdx: 13, qty: 4 },  // Delta PLC
        { prodIdx: 12, qty: 25 }, // Omron Relay
        { prodIdx: 15, qty: 8 },  // Polycab Cable
      ],
      transporter: 'VRL Logistics',
      vehicle: 'KA-04-MK-7711',
      notes: 'Industrial automation project package.',
      dateOffsetDays: -4,
    },
    {
      custIdx: 7,
      status: 'CONFIRMED',
      items: [
        { prodIdx: 30, qty: 50 }, // Corrugated Boxes
        { prodIdx: 31, qty: 80 }, // Stretch Film Roll
        { prodIdx: 32, qty: 15 }, // PET Strapping
      ],
      transporter: 'Patel Roadways',
      vehicle: 'GJ-27-TT-8901',
      notes: 'Bulk packaging supply. Palletized consignment.',
      dateOffsetDays: -2,
    },
    // Recent Confirmed
    {
      custIdx: 0,
      status: 'CONFIRMED',
      items: [
        { prodIdx: 0, qty: 300 }, // SS 316 Hex Bolt
        { prodIdx: 2, qty: 20 },  // Self Drilling Screw
        { prodIdx: 5, qty: 40 },  // Lock Nut
      ],
      transporter: 'TCI Freight Express',
      vehicle: 'MH-04-EQ-3312',
      notes: 'High tensile fastener monthly bulk order.',
      dateOffsetDays: -1,
    },
    // DRAFT Challans (Do NOT reduce stock)
    {
      custIdx: 8,
      status: 'DRAFT',
      items: [
        { prodIdx: 41, qty: 20 }, // Brass Hex Rod
        { prodIdx: 42, qty: 25 }, // Aluminum Profile
      ],
      transporter: 'To be assigned upon confirmation',
      vehicle: 'Pending dispatch',
      notes: 'Draft quotation order pending client purchase order sign-off.',
      dateOffsetDays: 0,
    },
    {
      custIdx: 9,
      status: 'DRAFT',
      items: [
        { prodIdx: 10, qty: 15 }, // Schneider MCB
        { prodIdx: 11, qty: 10 }, // Siemens Contactor
        { prodIdx: 17, qty: 2 },  // Power Meter
      ],
      transporter: 'Navata Road Transport',
      vehicle: 'Pending',
      notes: 'Awaiting site engineer readiness confirmation.',
      dateOffsetDays: 0,
    },
    {
      custIdx: 10,
      status: 'DRAFT',
      items: [
        { prodIdx: 15, qty: 10 }, // Cable
        { prodIdx: 16, qty: 15 }, // Terminal Blocks
      ],
      transporter: 'Pending',
      vehicle: 'Pending',
      notes: 'Microtek power project quote draft.',
      dateOffsetDays: 0,
    },
    // CANCELLED Challan
    {
      custIdx: 11,
      status: 'CANCELLED',
      items: [
        { prodIdx: 0, qty: 100 },
        { prodIdx: 1, qty: 50 },
      ],
      transporter: 'V-Trans Logistics',
      vehicle: 'GJ-06-KK-1100',
      notes: 'Cancelled due to customer site project postponement.',
      dateOffsetDays: -15,
      cancellationReason: 'Client requested postponement till Q3. Stock reversed to Bhiwandi Hub.',
    },
  ];

  let challanSeq = 1;
  const createdChallans: any[] = [];
  const stockMovementsToCreate: any[] = [];

  for (const c of challanData) {
    const challanNumber = `SC-2026-${String(challanSeq).padStart(4, '0')}`;
    challanSeq++;

    const createdAtDate = new Date(today.getTime() + c.dateOffsetDays * 24 * 3600 * 1000);

    let totalQuantity = 0;
    let subTotal = 0;
    const itemsData = [];

    for (const item of c.items) {
      const prod = createdProducts[item.prodIdx];
      const lineTotal = prod.unitPrice * item.qty;
      totalQuantity += item.qty;
      subTotal += lineTotal;

      itemsData.push({
        productId: prod.id,
        productNameSnapshot: prod.name,
        skuSnapshot: prod.sku,
        unitPriceSnapshot: prod.unitPrice,
        quantity: item.qty,
        lineTotal,
      });
    }

    const taxRate = 18.0;
    const taxAmount = (subTotal * taxRate) / 100;
    const grandTotal = subTotal + taxAmount;

    const challan = await prisma.salesChallan.create({
      data: {
        challanNumber,
        customerId: createdCustomers[c.custIdx].id,
        status: c.status,
        totalQuantity,
        subTotal,
        taxRate,
        taxAmount,
        grandTotal,
        notes: c.notes,
        terms: '1. Goods once dispatched are non-returnable unless defective.\n2. Payment terms 30 days from challan date.\n3. Subject to Mumbai Jurisdiction.',
        dispatchThrough: c.transporter,
        vehicleNumber: c.vehicle,
        createdById: createdUsers['sales@flowledger.io'].id,
        confirmedById: c.status === 'CONFIRMED' ? createdUsers['admin@flowledger.io'].id : null,
        confirmedAt: c.status === 'CONFIRMED' ? createdAtDate : null,
        cancelledById: c.status === 'CANCELLED' ? createdUsers['admin@flowledger.io'].id : null,
        cancelledAt: c.status === 'CANCELLED' ? new Date(createdAtDate.getTime() + 3600 * 1000) : null,
        cancellationReason: c.cancellationReason || null,
        createdAt: createdAtDate,
        updatedAt: createdAtDate,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    createdChallans.push(challan);

    // If CONFIRMED, create StockMovement OUT records!
    if (c.status === 'CONFIRMED') {
      for (const item of challan.items) {
        const prod = createdProducts.find(p => p.id === item.productId)!;
        stockMovementsToCreate.push({
          productId: prod.id,
          warehouseId: prod.warehouseId,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: 'SALES_CHALLAN',
          referenceNumber: challan.challanNumber,
          challanId: challan.id,
          createdById: createdUsers['warehouse@flowledger.io'].id,
          notes: `Dispatched against confirmed sales challan ${challan.challanNumber} for ${createdCustomers[c.custIdx].businessName}`,
          createdAt: createdAtDate,
        });
      }
    }
  }

  console.log(`✅ Created ${createdChallans.length} Sales Challans.`);

  // 9. Initial Stock Inward Movements (Purchase Receipts, POs, Inward Stock) to make 100+ movements!
  const stockReasons = ['PURCHASE_RECEIVED', 'MANUAL_ADJUSTMENT', 'STOCK_RETURN'];
  for (let i = 0; i < createdProducts.length; i++) {
    const prod = createdProducts[i];
    // Inward movement 1: Initial PO receipt
    stockMovementsToCreate.push({
      productId: prod.id,
      warehouseId: prod.warehouseId,
      quantity: prod.currentStock + 150,
      movementType: 'IN',
      reason: 'PURCHASE_RECEIVED',
      referenceNumber: `PO-2026-${String(1000 + i)}`,
      createdById: createdUsers['warehouse@flowledger.io'].id,
      notes: `Initial bulk procurement receipt from certified vendor. QC passed.`,
      createdAt: new Date(today.getTime() - (45 + (i % 10)) * 24 * 3600 * 1000),
    });

    // Inward movement 2: Secondary batch receipt for key items
    if (i % 2 === 0) {
      stockMovementsToCreate.push({
        productId: prod.id,
        warehouseId: prod.warehouseId,
        quantity: 50,
        movementType: 'IN',
        reason: 'PURCHASE_RECEIVED',
        referenceNumber: `PO-2026-${String(2000 + i)}`,
        createdById: createdUsers['warehouse@flowledger.io'].id,
        notes: `Replenishment stock delivery from central logistics depot.`,
        createdAt: new Date(today.getTime() - (15 + (i % 5)) * 24 * 3600 * 1000),
      });
    }

    // Occasional manual adjustment or return
    if (i % 7 === 0) {
      stockMovementsToCreate.push({
        productId: prod.id,
        warehouseId: prod.warehouseId,
        quantity: 5,
        movementType: 'IN',
        reason: 'STOCK_RETURN',
        referenceNumber: `RET-2026-0${i}`,
        createdById: createdUsers['warehouse@flowledger.io'].id,
        notes: `Returned surplus items re-inspected and stocked into bin.`,
        createdAt: new Date(today.getTime() - (10 + (i % 3)) * 24 * 3600 * 1000),
      });
    }
  }

  // Insert all stock movements
  for (const sm of stockMovementsToCreate) {
    await prisma.stockMovement.create({ data: sm });
  }
  console.log(`✅ Created ${stockMovementsToCreate.length} Total Stock Movements (Complete Stock Ledger).`);

  // 10. Audit Activity Logs
  const auditLogsData = [
    {
      userId: createdUsers['admin@flowledger.io'].id,
      userName: 'Sourav Singh',
      action: 'LOGIN',
      entity: 'User',
      entityId: createdUsers['admin@flowledger.io'].id,
      detailsJson: JSON.stringify({ message: 'User logged in successfully via web console' }),
      ipAddress: '192.168.1.100',
    },
    {
      userId: createdUsers['sales@flowledger.io'].id,
      userName: 'Priya Sharma',
      action: 'CUSTOMER_CREATE',
      entity: 'Customer',
      entityId: createdCustomers[0].id,
      detailsJson: JSON.stringify({ customerName: 'Bharat Heavy Equipments Pvt Ltd', type: 'WHOLESALE', city: 'Navi Mumbai' }),
      ipAddress: '192.168.1.105',
    },
    {
      userId: createdUsers['warehouse@flowledger.io'].id,
      userName: 'Arun Kumar Patel',
      action: 'STOCK_IN',
      entity: 'Product',
      entityId: createdProducts[0].id,
      detailsJson: JSON.stringify({ sku: 'SKU-HDW-1001', quantity: 2400, reason: 'PURCHASE_RECEIVED', po: 'PO-2026-1000' }),
      ipAddress: '192.168.1.110',
    },
    {
      userId: createdUsers['sales@flowledger.io'].id,
      userName: 'Priya Sharma',
      action: 'CHALLAN_CREATE',
      entity: 'SalesChallan',
      entityId: createdChallans[0].id,
      detailsJson: JSON.stringify({ challanNumber: 'SC-2026-0001', totalAmount: createdChallans[0].grandTotal }),
      ipAddress: '192.168.1.105',
    },
    {
      userId: createdUsers['admin@flowledger.io'].id,
      userName: 'Sourav Singh',
      action: 'CHALLAN_CONFIRM',
      entity: 'SalesChallan',
      entityId: createdChallans[0].id,
      detailsJson: JSON.stringify({ challanNumber: 'SC-2026-0001', status: 'CONFIRMED', stockDeducted: true }),
      ipAddress: '192.168.1.100',
    },
    {
      userId: createdUsers['warehouse@flowledger.io'].id,
      userName: 'Arun Kumar Patel',
      action: 'MANUAL_ADJUSTMENT',
      entity: 'Product',
      entityId: createdProducts[7].id,
      detailsJson: JSON.stringify({ sku: 'SKU-HDW-1008', adjustment: -2, reason: 'Damaged item identified during cycle count' }),
      ipAddress: '192.168.1.110',
    },
  ];

  for (const a of auditLogsData) {
    await prisma.auditLog.create({ data: a });
  }
  console.log(`✅ Created ${auditLogsData.length} Audit Activity Logs.`);

  // 11. Notifications
  const notificationsData = [
    {
      userId: null,
      title: '🔴 Critical Stock Alert: 4 Products Below Minimum',
      message: 'U-Bolt 4" (SKU-HDW-1009), Power Meter (SKU-ELC-2008), Dial Gauge (SKU-TOL-3008), Corner Protectors (SKU-PKG-4009) have critical inventory levels.',
      type: 'LOW_STOCK',
      link: '/inventory?filter=critical',
    },
    {
      userId: null,
      title: '⏱️ Overdue Follow-ups Require Action',
      message: '3 client follow-ups are overdue including Bharat Heavy Equipments contract renewal.',
      type: 'OVERDUE_FOLLOWUP',
      link: '/followups',
    },
    {
      userId: null,
      title: '📦 Sales Challan #SC-2026-0008 Confirmed',
      message: 'Challan for Reliance Retail Wholesale Depot confirmed. Inventory automatically deducted.',
      type: 'CHALLAN_CONFIRMED',
      link: '/challans',
    },
    {
      userId: null,
      title: 'ℹ️ System Scheduled Backup Completed',
      message: 'Nightly database snapshot & immutable ledger sync completed without errors.',
      type: 'SYSTEM',
      link: '/audit-logs',
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`✅ Created ${notificationsData.length} System Notifications.`);

  console.log('\n🎉 Seed data successfully created!');
  console.log('========================================================');
  console.log('👤 DEMO USERS FOR EVALUATION:');
  console.log('  1. ADMIN:     admin@flowledger.io     / password123');
  console.log('  2. SALES:     sales@flowledger.io     / password123');
  console.log('  3. WAREHOUSE: warehouse@flowledger.io / password123');
  console.log('  4. ACCOUNTS:  accounts@flowledger.io  / password123');
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
