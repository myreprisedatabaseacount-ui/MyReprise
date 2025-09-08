import React from 'react';
import SubjectDetailsClient from './SubjectDetailsClient';

interface SubjectDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const SubjectDetailsPage: React.FC<SubjectDetailsPageProps> = async ({ params }) => {
  const { id } = await params;
  const subjectId = parseInt(id);

  return <SubjectDetailsClient subjectId={subjectId} />;
};

export default SubjectDetailsPage;
