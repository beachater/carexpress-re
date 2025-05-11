export function generatePrescriptionHTML({
  patientName,
  age,
  date,
  medications,
  doctorName,
}: {
  patientName: string;
  age: string;
  date: string;
  medications: {
    medicine_name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }[];
  doctorName: string;
}) {
  const medicationList = medications
    .map(
      (m) => `
        <div style="margin-bottom: 12px;">
          <strong>${m.medicine_name}</strong> - ${m.dosage} for ${m.duration}<br/>
          ${m.instructions ? `<em>Instructions: ${m.instructions}</em>` : ''}
        </div>
      `
    )
    .join('');

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            margin: 0 auto;
            max-width: 500px;
            background: #ffffff;
            border: 1px solid #ddd;
            border-radius: 10px;
          }
          .header {
            margin-bottom: 20px;
          }
          .rx-image {
            width: 60px;
            margin: 20px 0;
            display: block;
          }
          .medications {
            margin-top: 20px;
          }
          .signature {
            margin-top: 60px;
            border-top: 1px solid #000;
            width: 200px;
            text-align: right;
            float: right;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div><strong>Patient Name:</strong> ${patientName}</div>
          <div><strong>Age:</strong> ${age}</div>
          <div><strong>Date:</strong> ${date}</div>
        </div>

        <img src="https://gdudalmvhmcindbmmwox.supabase.co/storage/v1/object/public/prescriptions/rx-icon-6.png" class="rx-image" alt="Rx" />

        <div class="medications">
          ${medicationList}
        </div>

        <div class="signature">
          Dr. ${doctorName}
        </div>
      </body>
    </html>
  `;
}
