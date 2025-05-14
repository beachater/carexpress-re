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
    duration: string; // ISO string of end date
    instructions?: string;
  }[];
  doctorName: string;
}) {
  const prcLicense = Math.floor(1000000 + Math.random() * 9000000);

  const medicationList = medications
    .map((m) => {
      const endDate = new Date(m.duration);
      const startDate = new Date();
      const durationInDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const formattedEndDate = endDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return `
        <div style="margin-bottom: 12px;">
          <strong>${m.medicine_name}</strong> - ${m.dosage} for ${durationInDays} days (until ${formattedEndDate})<br/>
          ${m.instructions ? `<em>Instructions: ${m.instructions}</em>` : ''}
        </div>
      `;
    })
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
          .centered {
            text-align: center;
          }
          .divider {
            margin: 12px auto;
            border-top: 1px solid #ccc;
            width: 100%;
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
            width: 100%;
            text-align: right;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="centered">
          <div><strong>Maxicare Lady Madonna Hospital</strong></div>
          <div>123 Health Street, Cagayan de Oro</div>
        </div>

        <div class="divider"></div>

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
          Dr. ${doctorName}<br/>
          PRC License #: ${prcLicense}
        </div>
      </body>
    </html>
  `;
}
