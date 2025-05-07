export function generatePrescriptionHTML({
  patientName,
  age,
  date,
  medications,
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
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            position: relative;
          }
          .header {
            margin-bottom: 20px;
          }
          .rx-image {
            width: 80px;
            margin-top: 20px;
          }
          .medications {
            margin-top: 30px;
          }
          .signature {
            margin-top: 60px;
            border-top: 1px solid #000;
            width: 200px;
            text-align: right;
            float: right;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div><strong>Patient Name:</strong> ${patientName}</div>
          <div><strong>Age:</strong> ${age}</div>
          <div><strong>Date:</strong> ${date}</div>
        </div>

        <img src="https://gdudalmvhmcindbmmwox.supabase.co/storage/v1/object/public/prescriptions//rx-icon-6.png" class="rx-image" alt="Rx" />

        <div class="medications">
          ${medicationList}
        </div>

        <div class="signature">
          <div>Doctor</div>
        </div>
      </body>
    </html>
  `;
}
