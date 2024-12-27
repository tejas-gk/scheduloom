import html2canvas from 'html2canvas';

export const downloadTimetableAsPng = async (timetableId: string, className: string) => {
    const timetableElement = document.getElementById(timetableId);
    if (!timetableElement) {
        console.error('Timetable element not found');
        return;
    }

    try {
        const canvas = await html2canvas(timetableElement);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${className}_timetable.png`;
        link.click();
    } catch (error) {
        console.error('Error generating PNG:', error);
    }
};

